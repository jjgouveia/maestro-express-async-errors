![node-current](https://img.shields.io/node/v/maestro-express-async-errors)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![CI RELEASE](https://github.com/jjgouveia/maestro-express-async-errors/actions/workflows/ci.yml/badge.svg)](https://github.com/jjgouveia/maestro-express-async-errors/actions/workflows/ci.yml)
![Downloads](https://img.shields.io/npm/dy/maestro-express-async-errors)
# Maestro for Express Async Errors
### 🏆 The async/await heaven!
<hr>

## Maestro is a layer of code that acts as a wrapper, without any dependencies, for async middlewares. Its purpose is to ensure that all errors occurring in async operations are properly passed to your stack of error handlers. By doing so, Maestro helps to improve the readability and cleanliness of your code.


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
> The minimum supported `Node` version for Maestro is `7.6.0`.

## How to use it

**With maestro:**

```javascript
const { maestro } = require('maestro-express-async-errors');


express.get('/', maestro(async (req, res, next) => {
	const bar = await foo.findAll();
	res.send(bar)
}))
```

**Without maestro:**

```javascript
express.get('/',(req, res, next) => {
    foo.findAll()
    .then ( bar => {
       res.send(bar)
     } )
    .catch(next); // error passed on to the error handling route
})
```
### So Easy right? 😉

**Now let I show you more exemples and functionalities:**

*  `maestro` insures thrown errors are passed to `next` callback:

```js
const { maestro } = require('maestro-express-async-errors');

app.get('/:id', maestro(async (req, res, next) => {
    const user = await repository.getById(req.params.id)

    if (!user) {
      throw new UserNotFoundError
    }

    res.status(200)
       .json(user)
}))

```

* `maestro.from` allows you to handle a specific error which is helpful for handling domain driven errors.
```js

app.use(maestro.from(UserNotFoundError, (err, req, res, next) => {
    res.status(404)
       .json({ error: 'these are not the droids you\'re looking for'})
})

/**
  Your error handlers still works as expected. If an error doesn't match your `maestro.from` criteria, it will find its way to the next error handler.
 */
app.use((err, req, res, next) => {
    res.status(500)
       .json({ error: 'i have a bad feeling about this'})
})

```

*  There's a helper function `maestro.all([...])` in case you want to wrap several functions with `maestro`. With `maestro.all`, doing `[maestro(fn1), maestro(fn2)]` can be shortened to `maestro.all([fn1, fn2])`.

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
#### Import in Typescript:

```javascript
import { maestro } from "maestro-express-async-errors"
```

<br>

## Test Cases

```txt
> maestro-express-async-errors@1.0.0 test
> mocha --require ts-node/register test/**/*.ts

  Try maestro(async (req, res, next) => { next() or Error }) :
    Basic functionality:
      ✔ Maestro is a function.
      ✔ Maestro returns a function.
      ✔ Maestro returns a function that returns a promise.
      ✔ When an asynchronous function passed into it throws an error, it is expected that the calls next with that error.
      ✔ When a non-asynchronous function passed into it throws an error, it is expected that calls next with that error.
      ✔ Should invoke `next` when passing a non-async function.
    Should invoke `next` with the thrown error:
      ✔ If an async function is passed as an argument, the next function should be called with the provided arguments.
      ✔ Works like a charm if all arguments are passed to the callback function.
      ✔ Raises a TypeError if next args it's not a function.
      ✔ A valid call works for routes and middlewares.
      ✔ A valid call works for error handler middlewares.

  Try maestro.from(RealProblems, (err) => { }) :
    ✔ Handles the error when error is instance of given constructor.
    ✔ It call `next` function if error is not an instance of given constructor.

  Try maestro.all([...args]) :
    ✔ Raises a TypeError when `next` it's not function.
    ✔ Should return an array.
    ✔ Should return an array of functions
    ✔ Should return an array of functions that returns a promise.
    ✔ Should return an array of functions that returns a promise that calls next.
    ✔ Should return an array of functions that returns a promise that calls next with the error.


  19 passing (109ms)
```


