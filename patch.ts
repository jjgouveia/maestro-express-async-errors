import { catchThenables } from "./forward";

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

type ExpressPackage = { version: string };

const defaultLoadExpressPackage = (): ExpressPackage =>
  require("express/package.json");

const defaultLoadRouterInternals = (): RouterInternals => ({
  Layer: require("express/lib/router/layer"),
  Router: require("express/lib/router"),
});

let isPatched = false;
let expressMajorOverride: number | null = null;
let loadExpressPackage = defaultLoadExpressPackage;
let loadRouterInternals = defaultLoadRouterInternals;

function getExpressMajor(): number {
  if (expressMajorOverride !== null) {
    return expressMajorOverride;
  }
  const pkg = loadExpressPackage();
  return Number.parseInt(pkg.version.split(".")[0] ?? "0", 10);
}

function wrap(fn: AnyFn): AnyFn {
  const noop = Function.prototype as (...args: any[]) => void;

  function wrapped(this: unknown, ...args: any[]) {
    const ret = fn.apply(this, args);
    const next =
      (args.length === 5 ? args[2] : args[args.length - 1]) || noop;
    return catchThenables(ret, next);
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

/** @internal */
export function __resetPatchTestState(): void {
  isPatched = false;
  expressMajorOverride = null;
  loadExpressPackage = defaultLoadExpressPackage;
  loadRouterInternals = defaultLoadRouterInternals;
}

/** @internal */
export function __setExpressMajorForTests(major: number | null): void {
  expressMajorOverride = major;
}

/** @internal — inject loaders (no force-flags on the production path) */
export function __setPatchDepsForTests(
  deps: {
    loadExpressPackage?: (() => ExpressPackage) | null;
    loadRouterInternals?: (() => RouterInternals) | null;
  } | null
): void {
  if (!deps) {
    loadExpressPackage = defaultLoadExpressPackage;
    loadRouterInternals = defaultLoadRouterInternals;
    return;
  }
  if (deps.loadExpressPackage !== undefined) {
    loadExpressPackage =
      deps.loadExpressPackage ?? defaultLoadExpressPackage;
  }
  if (deps.loadRouterInternals !== undefined) {
    loadRouterInternals =
      deps.loadRouterInternals ?? defaultLoadRouterInternals;
  }
}

/** @internal */
export function __isPatchedForTests(): boolean {
  return isPatched;
}
