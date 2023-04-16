import { ErrorRequestHandler, RequestHandler, Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

type ErrorConstructor<T extends unknown[]> = new (...args: T) => ErrorRequestHandler;
type Callback<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = Query> = (...args: Parameters<RequestHandler<P, ResBody, ReqBody, ReqQuery>>) => void;
interface Maestro {
    (middleware: Callback): Callback;
    from(constructor: ErrorConstructor<[]>, middleware: Callback): Callback;
    all(callbacks: Callback[]): Callback[];
}
declare const maestro: {
    (middleware: Callback): (...args: any[]) => Promise<void>;
    from(constructor: any, middleware: (arg0: Error, arg1: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, arg2: Response<any, Record<string, any>>, arg3: NextFunction) => void): (err: Error, req: Request, res: Response, next: NextFunction) => void;
    all(callbacks: Callback[]): ((...args: any[]) => Promise<void>)[];
};

export { Callback, ErrorConstructor, Maestro, maestro };
