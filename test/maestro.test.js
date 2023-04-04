'use strict'

const { expect } = require('chai').use(require('chai-as-promised'))
const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const maestro = require('../dist/index.js')

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
      const foo = maestro(async (_req, _res, _next) => {
        throw error
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    });

    it('Should call next with the error when an non-async function passed into it throws', async () => {
      const error = new Error('Oh! You catch me!')
      const foo = maestro((_req, _res, next) => {
        next(error)
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith(error)
    })

    it('Should call next when a non-async function passed', async () => {
      const next = sinon.spy()
      const foo = maestro((_req, _res, next) => {
        next('test')
      })

      await foo({}, {}, next)
      expect(next).to.have.been.calledWith('test')
    })

  });

  describe('Calls the last argument (next) with the thrown error', () => {
    const error = new Error()
    const route = maestro(async (_req, _res, _next) => { throw error })

    it('Should call next with the arguments when an async function passed into it calls next', async () => {
      const next = sinon.spy()
      const foo = maestro(async (_req, _res, next) => {
        next('test')
      })

      await foo(null, null, next)
      expect(next).to.have.been.calledWith('test')
    })

    it('All arguments are been passed to the callback', async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const spy3 = sinon.spy()

      const callable = maestro((arg1, arg2, arg3) => {
        [arg1, arg2, arg3].forEach(arg => arg())
      })

      await callable(spy1, spy2, spy3)

      expect(spy1.called).to.equals(true)
      expect(spy2.called).to.equals(true)
      expect(spy3.called).to.equals(true)
    })

    it('Raises a TypeError if last argument is not a function', () => {
      return Promise.all([
        expect(route({})).to.eventually.be.rejectedWith(TypeError, 'The last parameter received is not a function.'),
        expect(route({}, {})).to.eventually.be.rejectedWith(TypeError, 'The last parameter received is not a function.'),
        expect(route({}, {}, {})).to.eventually.be.rejectedWith(TypeError, 'The last parameter received is not a function.'),
        expect(route({}, {}, {}, {})).to.eventually.be.rejectedWith(TypeError, 'The last parameter received is not a function.')
      ])
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
    const matchedHandler = (err) => {
      expect(err).to.be.instanceOf(RealProblems)
    }

    const next = (_err) => {
      throw new Error('Not supposed to call this function')
    }

    maestro.from(RealProblems, matchedHandler)(new RealProblems(), req, res, next)
    maestro.from(Error, matchedHandler)(new RealProblems(), req, res, next)
  })

  it('It call `next` function if error is not an instance of given constructor', () => {
    const matchedHandler = (_err) => {
      throw new Error('Not supposed to call this function')
    }

    const next = (err) => {
      expect(err).to.be.instanceOf(NonRealProblems)
    }

    maestro.from(RealProblems, matchedHandler)(new NonRealProblems(), req, res, next)
  })
})

describe('Tries maestro.all([fn1, fn2, fn3])', () => {
  const fn = async (_cb) => { throw new Error('foo') }

  it('All given functions are wrapped with maestro', () => {
    const [maestroFn] = maestro.all([fn])

    return Promise.all([
      // Proves that the rescued function contains additional behavior that is
      // added when a fn is wrapped with `maestro`.
      expect(maestroFn()).to.eventually.be.rejectedWith(TypeError, 'The last parameter received is not a function.')
    ])
  })
})









