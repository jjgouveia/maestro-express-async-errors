import { ErrorRequestHandler, RequestHandler } from 'express';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export type ErrorConstructor<T extends unknown[]> = new (...args: T) => ErrorRequestHandler;

export type Callback<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
> = (...args: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>) => void;

export interface Maestro {
  (middleware: Callback): Callback;
  from(constructor: ErrorConstructor<[]>, middleware: Callback): Callback;
  all(callbacks: Callback[]): Callback[];
}


const maestro = function opera(middleware: Callback) {
  return async function orchestra(...args: any[]): Promise<void> {
    const fnReturn = middleware(...args as Parameters<RequestHandler>)
    const next = args[args.length - 1]

    if (typeof next !== 'function') {
      throw new TypeError("Next is not a function")
    }

    try {
      return Promise.resolve(fnReturn).catch(next)
    } catch (err) {
      throw new Error("No recognized error")
    }
  };
}

maestro.from = function from(constructor: any, middleware: (arg0: Error,
  arg1: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  arg2: Response<any, Record<string, any>>,
  arg3: NextFunction) => void) {
  return function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (!(err instanceof constructor)) {
      next(err);
      return;
    }

    middleware(err, req, res, next);
  };
};


maestro.all = function all(callbacks: Callback[]) {
  return callbacks.map(maestro)
}

Object.freeze(maestro);
Object.freeze(maestro.from);
Object.freeze(maestro.all);

export { maestro }