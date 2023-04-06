# Maestro for Express Async Errors
### 🏆 The async/await heaven!
<hr>

## Maestro is a layer of sugar code, free of dependencies, designed for asynchronous middlewares. Its purpose is to ensure that all asynchronous errors are transferred to your stack of error handlers, resulting in cleaner and more readable code.

### Installation:

```
npm install --save maestro-express-async-errors
```
or
```
yarn add maestro-express-async-errors
```
<br>

> **Note**
> The minimum supported `Node` version for Maestro is `7.6`. However, due to tooling limitations (`Node 10`), I'm unable to test this library against versions `7`, `8`, and `9`. I will continue trying to support older projects with updates, but please, note that I am unable to verify compatibility with the mentioned versions.

## How to use it

It's really simple:

```js
const maestro = require('maestro-express-async-errors')

/*
  `maestro` insures thrown errors are passed to `next` callback.
 */
app.get('/:id', maestro(async (req, res, next) => {
    const user = await repository.getById(req.params.id)

    if (!user) {
      throw new UserNotFoundError
    }

    res.status(200)
       .json(user)
}))

/*
  `maestro.from` allows you to handle a specific error which is helpful for
   handling domain errors.
 */
app.use(maestro.from(UserNotFoundError, (err, req, res, next) => {
    res.status(404)
       .json({ error: 'these are not the droids you\'re looking for'})
})

/**
  Your error handlers still works as expected. If an error doesn't match your
  `maestro.from` criteria, it will find its way to the next error handler.
 */
app.use((err, req, res, next) => {
    res.status(500)
       .json({ error: 'i have a bad feeling about this'})
})

```

There's a helper function `maestro.all([...])` in case you want to wrap several functions with `maestro`. With `maestro.all`, doing `[maestro(fn1), maestro(fn2)]` can be shortened to `maestro.all([fn1, fn2])`.

```js
const maestro = require('maestro-express-async-errors')

// Doing it like this
app.post('/products', maestro.all([
    validationFn,
    createProductFn
]))

// Is equivalent to this
app.post('/products', [
    maestro(validationFn),
    maestro(createProductFn)
])
```

**I hope you enjoy it**


## Test Cases

```txt
> maestro-express-async-errors@1.2.0 test
> mocha test/*.test.js --check-leaks --full-trace --use_strict --recursive

  const callable = maestro(async ([err,] req, res, next) => { })
    calls the last argument (next) with the thrown error
      ✔ All arguments are been passed to the callback
      ✔ Raises a TypeError if last argument is not a function
      ✔ callable(req, res, next) - works for routes and middlewares
      ✔ callable(err, req, res, next) - works for error handler middlewares
      ✔ callable(foo, bar, baz, foobar, foobaz, errorHandler) - should work for
        basically anything, as long as your function takes an error handler as
        the last parameter

  maestro.from(MyError, (err) => { })
    ✔ handles the error when error is instance of given constructor
    ✔ it call `next` function if error is not an instance of given constructor

  const callables = maestro.all([fn1, fn2, fn3])
    ✔ All given functions are wrapped with maestro

  8 passing (8ms)
```

### Usage:

```javascript
const maestro = require('maestro-express-async-errors')

express.get('/', maestro(async (req, res, next) => {
	const bar = await foo.findAll();
	res.send(bar)
}))
```

Without maestro-express-async-errors

```javascript
express.get('/',(req, res, next) => {
    foo.findAll()
    .then ( bar => {
       res.send(bar)
     } )
    .catch(next); // error passed on to the error handling route
})
```

#### Import in Typescript:

```javascript
import maestro from "maestro-express-async-errors"
```
