"use strict";

import { expect } from "chai";
import sinon from "sinon";
import { maestro, asyncHandler, patch } from "../index";
import { __isPatchedForTests } from "../patch";
import {
  resetPatchTestHooks,
  __setExpressMajorForTests,
  __setForceExpressMissingForTests,
  __setForceInternalsFailureForTests,
} from "./helpers";

describe("public API surface", () => {
  it("exposes maestro.patch as the same function as patch()", () => {
    expect(maestro.patch).to.equal(patch);
  });

  it("exposes asyncHandler as the same function as maestro", () => {
    expect(asyncHandler).to.equal(maestro);
    expect(asyncHandler.from).to.equal(maestro.from);
    expect(asyncHandler.all).to.equal(maestro.all);
    expect(asyncHandler.patch).to.equal(maestro.patch);
  });
});

describe("register side-effect entry", () => {
  afterEach(resetPatchTestHooks);

  it("calls patch() when the register module is loaded", () => {
    resetPatchTestHooks();
    __setExpressMajorForTests(5);
    expect(__isPatchedForTests()).to.equal(false);

    for (const key of Object.keys(require.cache)) {
      if (key.replace(/\\/g, "/").endsWith("/register.ts")) {
        delete require.cache[key];
      }
    }

    require("../register");

    expect(__isPatchedForTests()).to.equal(true);
  });
});

describe("patch failure modes", () => {
  afterEach(resetPatchTestHooks);

  it("throws a clear error when express cannot be resolved", () => {
    resetPatchTestHooks();
    __setForceExpressMissingForTests(true);

    expect(() => patch()).to.throw(
      /express is required to use maestro\.patch\(\) \/ register/
    );
    expect(__isPatchedForTests()).to.equal(false);
  });

  it("throws a clear error when Express 4 router internals cannot be loaded", () => {
    resetPatchTestHooks();
    __setExpressMajorForTests(4);
    __setForceInternalsFailureForTests(true);

    expect(() => patch()).to.throw(/could not load Express 4 router internals/);
    expect(__isPatchedForTests()).to.equal(false);
  });

  it("treats Express 3 as no-op like Express 5", () => {
    resetPatchTestHooks();
    __setExpressMajorForTests(3);

    expect(() => patch()).to.not.throw();
    expect(__isPatchedForTests()).to.equal(true);
  });
});

describe("maestro wrapper extra edge cases", () => {
  it("forwards rejected null / undefined to next", async () => {
    const nextNull = sinon.spy();
    await maestro(async () => Promise.reject(null))({}, {}, nextNull);
    expect(nextNull).to.have.been.calledWith(null);

    const nextUndef = sinon.spy();
    await maestro(async () => Promise.reject(undefined))({}, {}, nextUndef);
    expect(nextUndef).to.have.been.calledWith(undefined);
  });

  it("does not call next when handler returns a resolved non-promise value", async () => {
    const next = sinon.spy();
    await maestro(() => "ok")({}, {}, next);
    expect(next).not.to.have.been.called;
  });

  it("wraps error-middleware arity (4 args) and forwards thrown errors", async () => {
    const next = sinon.spy();
    const boom = new Error("eh");
    const handler = maestro(
      async (_err: Error, _req: unknown, _res: unknown, _next: unknown) => {
        throw boom;
      }
    );

    await handler(boom, {}, {}, next);
    expect(next).to.have.been.calledWith(boom);
  });

  it("maestro.all preserves order and length", () => {
    const a = async () => undefined;
    const b = async () => undefined;
    const wrapped = maestro.all([a, b]);
    expect(wrapped).to.have.length(2);
    expect(wrapped[0]).to.be.a("function");
    expect(wrapped[1]).to.be.a("function");
  });
});

describe("maestro.from extra edge cases", () => {
  class CodedError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = "CodedError";
      this.code = code;
    }
  }

  it("matches Error base constructor for any Error subclass", () => {
    const matched = sinon.spy();
    const next = sinon.spy();
    maestro.from(Error, matched)(
      new CodedError("x", "X"),
      {} as any,
      {} as any,
      next
    );
    expect(matched).to.have.been.calledOnce;
    expect(next).not.to.have.been.called;
  });

  it("does not treat plain objects as matching Error constructors", () => {
    const matched = sinon.spy();
    const next = sinon.spy();
    const weird = { message: "nope" } as Error;
    maestro.from(CodedError, matched)(weird, {} as any, {} as any, next);
    expect(matched).not.to.have.been.called;
    expect(next).to.have.been.calledWith(weird);
  });
});
