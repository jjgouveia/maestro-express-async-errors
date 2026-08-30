type AnyFn = (...args: any[]) => any;

let isPatched = false;
let expressMajorOverride: number | null = null;

function getExpressMajor(): number {
  if (expressMajorOverride !== null) {
    return expressMajorOverride;
  }
  const pkg = require("express/package.json") as { version: string };
  return Number.parseInt(pkg.version.split(".")[0] ?? "0", 10);
}

export function shouldApplyPatch(major: number): boolean {
  return major === 4;
}

function copyFnProps(oldFn: AnyFn, newFn: AnyFn): AnyFn {
  for (const key of Object.keys(oldFn)) {
    (newFn as any)[key] = (oldFn as any)[key];
  }
  return newFn;
}

function wrap(fn: AnyFn): AnyFn {
  const last = (arr: any[]) => arr[arr.length - 1];
  const noop = Function.prototype as (...args: any[]) => void;

  function wrapped(this: unknown, ...args: any[]) {
    const ret = fn.apply(this, args);
    const next =
      (args.length === 5 ? args[2] : last(args)) || noop;
    if (ret && typeof ret.catch === "function") {
      ret.catch((err: unknown) => next(err));
    }
    return ret;
  }

  Object.defineProperty(wrapped, "length", {
    value: fn.length,
    writable: false,
  });

  return copyFnProps(fn, wrapped);
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

  if (!shouldApplyPatch(major)) {
    isPatched = true;
    return;
  }

  let Layer: { prototype: { handle?: AnyFn; __handle?: AnyFn } };
  let Router: {
    prototype: {
      constructor: {
        param: (name: string, fn: AnyFn) => unknown;
      };
    };
  };

  try {
    // Express 4 internals — intentional require for monkey-patch.
    Layer = require("express/lib/router/layer");
    Router = require("express/lib/router");
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

/** @internal test helper — resets patch flag between suites */
export function __resetPatchFlagForTests(): void {
  isPatched = false;
}

/** @internal test helper — simulate Express major (e.g. 5) without installing it */
export function __setExpressMajorForTests(major: number | null): void {
  expressMajorOverride = major;
}
