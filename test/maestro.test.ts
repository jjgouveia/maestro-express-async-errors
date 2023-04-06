'use strict'

import { NextFunction, Request, Response } from "express";
import { assert, expect } from 'chai'
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import maestro from '../dist/index.js';

chai.use(sinonChai)
chai.should()

describe('Try maestro(async (req, res, next) => { next() or Error }) :', () => {
  const next = sinon.spy();

  describe("Basic functionality:", () => {
    it('Maestro is a function.', () => {
      expect(maestro).to.be.a('function')
    });

    it('Maestro returns a function.', () => {
      expect(maestro(() => { })).to.be.a('function')
    })

    it('Maestro returns a function that returns a promise.', () => {
      expect(maestro(() => { })()).to.be.a('promise')
    })

    it('When an asynchronous function passed into it throws an error, it is expected that the calls next with that error.', async () => {
      const error = new Error('Oh! You catch me!')
      const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
        throw error
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    });

    it('When a non-asynchronous function passed into it throws an error, it is expected that calls next with that error.', async () => {
      const error = new Error('Oh! You catch me!')
      const foo = maestro((_req: Request, _res: Response, _next: NextFunction) => {
        next(error)
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    })

    it('Should invoke `next` when passing a non-async function.', async () => {
      const next = sinon.spy()
      const foo = maestro((_req: Request, _res: Response, _next: NextFunction) => {
        next('test')
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith('test')
    })
  });

  describe('Should invoke `next` with the thrown error:', () => {
    const error = new TypeError("Next is not a function")
    const route = maestro(async (_req: Request, _res: Response, _next: NextFunction) => { throw error })

    it('If an async function is passed as an argument, the next function should be called with the provided arguments.', async () => {
      const next = sinon.spy()
      const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
        next('test')
      })

      await foo(null, null, next)
      expect(next).to.have.been.calledWith('test')
    })

    it('Works like a charm if all arguments are passed to the callback function.', async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const spy3 = sinon.spy()

      const callable = maestro((arg1: any, arg2: any, arg3: any) => {
        [arg1, arg2, arg3].forEach(arg => arg())
      })

      await callable(spy1, spy2, spy3)

      expect(spy1.called).to.equals(true)
      expect(spy2.called).to.equals(true)
      expect(spy3.called).to.equals(true)
    })

    it('Raises a TypeError if next args it\'s not a function.', async () => {
      try {
        await route({}, {}, {})
      } catch (error) {
        expect(error).to.deep.equal(new TypeError("Next is not a function"))
      }
    })

    it('A valid call works for routes and middlewares.', async () => {
      const spy = sinon.spy()

      await route({}, {}, spy)
      expect(spy.called).to.equals(true)
    })

    it('A valid call works for error handler middlewares.', async () => {
      const spy = sinon.spy()

      await route({}, {}, {}, spy)
      expect(spy.called).to.equals(true)
    })
  })
})

describe('Try maestro.from(RealProblems, (err) => { }) :', () => {
  class RealProblems extends Error { } // RealProblems is a subclass of Error.
  class NonRealProblems { } // NonRealProblems is not a subclass of Error,
  // that is, for example, what you get when you are anxious.

  const req = {}
  const res = {}

  it('Handles the error when error is instance of given constructor.', () => {
    const matchedHandler = (err: any) => {
      expect(err).to.be.instanceOf(RealProblems)
    }

    const next = (_err: any) => {
      throw new Error('Not supposed to call this function')
    }

    maestro.from(RealProblems, matchedHandler)(new RealProblems(), req, res, next)
    maestro.from(Error, matchedHandler)(new RealProblems(), req, res, next)
  })

  it('It call `next` function if error is not an instance of given constructor.', () => {
    const matchedHandler = (_err: any) => {
      throw new Error('Not supposed to call this function')
    }

    const next = (err: any) => {
      expect(err).to.be.instanceOf(NonRealProblems)
    }

    maestro.from(RealProblems, matchedHandler)(new NonRealProblems(), req, res, next)
  })
})

describe('Try maestro.all([...args]) :', () => {
  const fn = async (_cb: any) => { throw new TypeError() }
  const next = sinon.spy()
  const req = {}
  const res = {}
  const error = new Error('Oh! You catch me!')

  it('Raises a TypeError when `next` it\'s not function.', async () => {
    const [maestroFn] = maestro.all([fn])
    try {
      await maestroFn()
    } catch (error) {
      expect(error).to.deep.equal(new TypeError('Next is not a function'))
    }
  })

  it('Should return an array.', async () => {
    const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
      next('test')
    })

    expect(maestro.all([foo])).to.be.a('array')
  })
  it('Should return an array of functions', async () => {
    const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
      next('test')
    })

    expect(maestro.all([foo])[0]).to.be.a('function')
  })
  it('Should return an array of functions that returns a promise.', async () => {
    const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
      next('test')
    })

    expect(maestro.all([foo])[0]()).to.be.a('promise')
  })
  it('Should return an array of functions that returns a promise that calls next.', async () => {
    const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
      next('test')
    })

    await maestro.all([foo])[0](req, res, next)
    expect(next).to.have.been.calledWith('test')
  })
  it('Should return an array of functions that returns a promise that calls next with the error.', async () => {
    const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
      next(error)
    })

    await maestro.all([foo])[0](req, res, next)
    expect(next).to.have.been.calledWith(error)
  })
})
