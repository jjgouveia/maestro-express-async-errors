"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var maestro_express_async_errors_exports = {};
__export(maestro_express_async_errors_exports, {
  maestro: () => maestro
});
module.exports = __toCommonJS(maestro_express_async_errors_exports);
var maestro = function opera(middleware) {
  return async function orchestra(...args) {
    const fnReturn = middleware(...args);
    const next = args[args.length - 1];
    if (typeof next !== "function") {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  maestro
});
