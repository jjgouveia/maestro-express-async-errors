import { ErrorRequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';

export type ErrorConstructor<T extends unknown[]> = new (...args: T) => ErrorRequestHandler;

export type Callback = (...args: any[]) => Promise<void> | void;

export interface Maestro {
  (callback: Callback): Callback;
  from(constructor: ErrorConstructor<[]>, callback: Callback): Callback;
  all(callbacks: Callback[]): Callback[];
}

const maestro: Maestro = function (callback) {
  return async function orchestra(...args: any[]): Promise<void> {
    const next = args.slice(-1)[0] as NextFunction;

    if (typeof next !== 'function') {
      throw new TypeError(
        'The last parameter received is not a function. Are you sure you passed its return as a middleware?',
      );
    }

    try {
      await callback(...args); // eslint-disable-line
    } catch (err) {
      next(err);
    }
  };
};

maestro.from = function from(constructor, callback) {
  return function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof constructor)) {
      next(err);
      return;
    }

    callback(err, req, res, next);
  };
};

maestro.all = function all(callbacks) {
  const result: Callback[] = [];
  callbacks.forEach((callback) => {
    result.push(maestro(callback));
  });
  return result;
};

Object.freeze(maestro);
Object.freeze(maestro.from);
Object.freeze(maestro.all);

module.exports = maestro;

