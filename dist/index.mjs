// index.ts
var maestro = function opera(middleware) {
  return async function orchestra(...args) {
    const fnReturn = middleware(...args);
    const next = args[args.length - 1];
    if (typeof next !== typeof Function) {
      throw new TypeError("Next is not a function");
    }
    return Promise.resolve(fnReturn).catch(next);
  };
};
maestro.from = function from(constructor, middleware) {
  return function errorHandler(err, req, res, next) {
    if (!(err instanceof constructor)) {
      next(err);
      return;
    }
    middleware(err, req, res, next);
  };
};
maestro.all = function all(callbacks) {
  return callbacks.map(maestro);
};
Object.freeze(maestro);
Object.freeze(maestro.from);
Object.freeze(maestro.all);
export {
  maestro
};
