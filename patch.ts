type AnyFn = (...args: any[]) => any;

type RouterInternals = {
  Layer: { prototype: { handle?: AnyFn; __handle?: AnyFn } };
  Router: {
    prototype: {
      constructor: {
        param: (name: string, fn: AnyFn) => unknown;
      };
    };
  };
};

let isPatched = false;
let expressMajorOverride: number | null = null;
let forceExpressMissing = false;
let forceInternalsFailure = false;

function getExpressMajor(): number {
  if (expressMajorOverride !== null) {
    return expressMajorOverride;
  }
  if (forceExpressMissing) {
    throw new Error("express missing (test)");
  }
  const pkg = require("express/package.json") as { version: string };
  return Number.parseInt(pkg.version.split(".")[0] ?? "0", 10);
}

function loadRouterInternals(): RouterInternals {
  if (forceInternalsFailure) {
    throw new Error("internals missing (test)");
  }
  return {
    Layer: require("express/lib/router/layer"),
    Router: require("express/lib/router"),
  };
}

function wrap(fn: AnyFn): AnyFn {
  const noop = Function.prototype as (...args: any[]) => void;

  function wrapped(this: unknown, ...args: any[]) {
    const ret = fn.apply(this, args);
    const next =
      (args.length === 5 ? args[2] : args[args.length - 1]) || noop;
    if (ret && typeof ret.catch === "function") {
      ret.catch((err: unknown) => next(err));
    }
    return ret;
  }

  Object.defineProperty(wrapped, "length", {
    value: fn.length,
    writable: false,
  });

  for (const key of Object.keys(fn)) {
    (wrapped as any)[key] = (fn as any)[key];
  }
  return wrapped;
}

/**
 * Monkey-patches Express 4 router Layer to forward rejected promises to `next`.
 * No-op on Express 5+ (native promise support). Idempotent.
 */
export function patch(): void {
  if (isPatched) {
    return;
  }

  let major: number;
  try {
    major = getExpressMajor();
  } catch {
    throw new Error(
      "maestro-express-async-errors: express is required to use maestro.patch() / register"
    );
  }

  if (major !== 4) {
    isPatched = true;
    return;
  }

  let Layer: RouterInternals["Layer"];
  let Router: RouterInternals["Router"];

  try {
    ({ Layer, Router } = loadRouterInternals());
  } catch {
    throw new Error(
      "maestro-express-async-errors: could not load Express 4 router internals. " +
        "Use maestro() wrappers instead, or upgrade to Express 5 (native async errors)."
    );
  }

  Object.defineProperty(Layer.prototype, "handle", {
    enumerable: true,
    configurable: true,
    get() {
      return this.__handle;
    },
    set(fn: AnyFn) {
      this.__handle = wrap(fn);
    },
  });

  const originalParam = Router.prototype.constructor.param;
  Router.prototype.constructor.param = function param(
    this: unknown,
    name: string,
    fn: AnyFn
  ) {
    return originalParam.call(this, name, wrap(fn));
  };

  isPatched = true;
}

/** @internal — clears patch flag and all test overrides */
export function __resetPatchTestState(): void {
  isPatched = false;
  expressMajorOverride = null;
  forceExpressMissing = false;
  forceInternalsFailure = false;
}

/** @internal */
export function __setExpressMajorForTests(major: number | null): void {
  expressMajorOverride = major;
}

/** @internal */
export function __setForceExpressMissingForTests(value: boolean): void {
  forceExpressMissing = value;
}

/** @internal */
export function __setForceInternalsFailureForTests(value: boolean): void {
  forceInternalsFailure = value;
}

/** @internal */
export function __isPatchedForTests(): boolean {
  return isPatched;
}
