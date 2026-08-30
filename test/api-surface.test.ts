"use strict";

import { expect } from "chai";
import { asyncHandler, maestro, patch } from "../index";
import { __isPatchedForTests } from "../patch";
import {
  resetPatchTestHooks,
  __setExpressMajorForTests,
  __setPatchDepsForTests,
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
    __setPatchDepsForTests({
      loadExpressPackage: () => {
        throw new Error("express missing (test)");
      },
    });

    expect(() => patch()).to.throw(
      /express is required to use maestro\.patch\(\) \/ register/
    );
    expect(__isPatchedForTests()).to.equal(false);
  });

  it("throws a clear error when Express 4 router internals cannot be loaded", () => {
    resetPatchTestHooks();
    __setExpressMajorForTests(4);
    __setPatchDepsForTests({
      loadRouterInternals: () => {
        throw new Error("internals missing (test)");
      },
    });

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
