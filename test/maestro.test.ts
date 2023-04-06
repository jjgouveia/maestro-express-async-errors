'use strict'

import { NextFunction, Request, Response } from "express";
import { expect } from 'chai'

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import maestro from '../dist/index.js';

chai.use(sinonChai)
chai.should()

describe('Tries Maestro(async ([err,] req, res, next) => { })', () => {
  const next = sinon.spy();

  describe("Basic functionality", () => {

    it('Maestro is a function', () => {
      expect(maestro).to.be.a('function')
    });

    it('Should call next with the error when an async function passed into it throws', async () => {
      const error = new Error('Oh! You catch me!')
      const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
        throw error
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    });

    it('Should call next with the error when an non-async function passed into it throws', async () => {
      const error = new Error('Oh! You catch me!')
      const foo = maestro((_req: Request, _res: Response, _next: NextFunction) => {
        next(error)
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    })

    it('Should call next when a non-async function passed', async () => {
      const next = sinon.spy()
      const foo = maestro((_req: Request, _res: Response, _next: NextFunction) => {
        next('test')
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith('test')
    })

  });

  describe('Calls the last argument (next) with the thrown error', () => {
    const error = new TypeError("Next is not a function")
    const route = maestro(async (_req: Request, _res: Response, _next: NextFunction) => { throw error })

    it('Should call next with the arguments when an async function passed into', async () => {
      const next = sinon.spy()
      const foo = maestro(async (_req: Request, _res: Response, _next: NextFunction) => {
        next('test')
      })

      await foo(null, null, next)
      expect(next).to.have.been.calledWith('test')
    })

    it('All arguments are been passed to the callback', async () => {
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

    it('Raises a TypeError if next args it\'s not a function', async () => {
      try {
        await route({}, {}, {})
      } catch (error) {
        expect(error).to.deep.equal(new TypeError("Next is not a function"))
      }
    })

    it('callable(req, res, next) - works for routes and middlewares', async () => {
      const spy = sinon.spy()

      await route({}, {}, spy)
      expect(spy.called).to.equals(true)
    })

    it('callable(err, req, res, next) - works for error handler middlewares', async () => {
      const spy = sinon.spy()

      await route({}, {}, {}, spy)
      expect(spy.called).to.equals(true)
    })
  })
})

describe('Tries maestro.from(RealProblems, (err) => { })', () => {
  class RealProblems extends Error { } // RealProblems is a subclass of Error.
  class NonRealProblems { } // NonRealProblems is not a subclass of Error,
  // that is, for example, what you get when you are anxious.

  const req = {}
  const res = {}

  it('Handles the error when error is instance of given constructor', () => {
    const matchedHandler = (err: any) => {
      expect(err).to.be.instanceOf(RealProblems)
    }

    const next = (_err: any) => {
      throw new Error('Not supposed to call this function')
    }

    maestro.from(RealProblems, matchedHandler)(new RealProblems(), req, res, next)
    maestro.from(Error, matchedHandler)(new RealProblems(), req, res, next)
  })

  it('It call `next` function if error is not an instance of given constructor', () => {
    const matchedHandler = (_err: any) => {
      throw new Error('Not supposed to call this function')
    }

    const next = (err: any) => {
      expect(err).to.be.instanceOf(NonRealProblems)
    }

    maestro.from(RealProblems, matchedHandler)(new NonRealProblems(), req, res, next)
  })
})

describe('Tries maestro.all([fn1, fn2, fn3])', () => {
  const fn = async (_cb: any) => { throw new TypeError() }

  it('All given functions are wrapped with maestro', async () => {
    const [maestroFn] = maestro.all([fn])
    try {
      await maestroFn()
    } catch (error) {
      expect(error).to.deep.equal(new TypeError('Next is not a function'))
    }
  })
})

