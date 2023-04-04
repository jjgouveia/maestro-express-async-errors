import { RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export declare type MaestroParameters = {
  P: ParamsDictionary,
  ResBody : any,
  ReqBody : any,
  ReqQuery : Query,
}

export declare type Handler = (err: Error, req: Request, res: Response, next: NextFunction) => Promise<void> | void;

export declare type ErrorConstructor = {
  new  (...args: Parameters<RequestHandler<MaestroParameters>>): Error;
}
export declare interface Maestro {
    (opera: Handler): Handler;
    from(constructor: ErrorConstructor, opera: Handler): Handler;
    all (callbacks: Handler[]): Handler[];
}


declare const maestro: Maestro;
export default maestro;



