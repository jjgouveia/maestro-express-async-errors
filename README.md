A simple middleware for handling exceptions inside of async express routes and passing them to your express error handlers based on "Express Async Handler".

### Installation:

```
npm install --save maestro-express-async-errors
```
or
```
yarn add maestro-express-async-errors (soon)
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
