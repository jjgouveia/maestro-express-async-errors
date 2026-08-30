import type { ErrorRequestHandler } from "express";
import {
  __resetPatchTestState,
  __setExpressMajorForTests,
  __setPatchDepsForTests,
} from "../patch";

export function jsonErrorHandler(status = 500): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    res.status(status).json({ error: err.message });
  };
}

export function resetPatchTestHooks(): void {
  __resetPatchTestState();
}

export { __setExpressMajorForTests, __setPatchDepsForTests };
