import {
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import { ParamsDictionary, Query } from "express-serve-static-core";
import { patch } from "./patch";

export type ErrorConstructor<T extends Error = Error> = new (
  ...args: any[]
) => T;

export type Callback<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query
> = (
  ...args: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>
) => any;

export type ErrorCallback<T extends Error = Error> = (
  err: T,
  req: Request,
  res: Response,
  next: NextFunction
) => any;

export interface Maestro {
  (middleware: Callback): Callback;
  from<T extends Error>(
    constructor: ErrorConstructor<T>,
    middleware: ErrorCallback<T>
  ): ErrorCallback;
  all(callbacks: Callback[]): Callback[];
  patch(): void;
}

function opera(middleware: Callback): Callback {
  return function orchestra(...args: any[]) {
    const next = args[args.length - 1];
    if (typeof next !== "function") {
      throw new TypeError("Next is not a function");
    }
    try {
      return Promise.resolve(
        middleware(...(args as Parameters<RequestHandler>))
      ).catch(next);
    } catch (err) {
      next(err);
    }
  };
}

const maestro = opera as Maestro;

maestro.from = function from<T extends Error>(
  constructor: ErrorConstructor<T>,
  middleware: ErrorCallback<T>
): ErrorCallback {
  return function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!(err instanceof constructor)) {
      next(err);
      return;
    }

    middleware(err, req, res, next);
  };
};

maestro.all = function all(callbacks: Callback[]) {
  return callbacks.map(maestro);
};

maestro.patch = patch;

Object.freeze(maestro);
Object.freeze(maestro.from);
Object.freeze(maestro.all);
Object.freeze(maestro.patch);

/** Drop-in alias for express-async-handler compatibility */
const asyncHandler = maestro;

export { maestro, asyncHandler, patch };
