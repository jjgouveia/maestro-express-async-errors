import express = require('express');
import core = require('express-serve-static-core');

declare function expressErrorsCompose<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
>(handler: (...args: Parameters<express.RequestHandler<P, ResBody, ReqBody, ReqQuery>>) => express.Response | Promise<express.Response>):
  express.RequestHandler<P, ResBody, ReqBody, ReqQuery>;

declare namespace expressErrorsCompose {

}

export = expressErrorsCompose;
