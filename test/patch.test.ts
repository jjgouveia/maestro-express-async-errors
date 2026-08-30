"use strict";

import { expect } from "chai";
import express from "express";
import request from "supertest";
import { maestro } from "../index";
import {
  __resetPatchFlagForTests,
  __setExpressMajorForTests,
  patch,
  shouldApplyPatch,
} from "../patch";

describe("shouldApplyPatch", () => {
  it("applies only on Express major 4", () => {
    expect(shouldApplyPatch(4)).to.equal(true);
    expect(shouldApplyPatch(5)).to.equal(false);
    expect(shouldApplyPatch(3)).to.equal(false);
  });
});

describe("maestro.patch() with mocked Express 5", () => {
  // Must run before the Express 4 suite mutates Layer.prototype.
  before(() => {
    __resetPatchFlagForTests();
    __setExpressMajorForTests(5);
  });

  after(() => {
    __setExpressMajorForTests(null);
    __resetPatchFlagForTests();
  });

  it("is a no-op and does not redefine Layer.prototype.handle", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Layer = require("express/lib/router/layer");
    const before = Object.getOwnPropertyDescriptor(Layer.prototype, "handle");

    expect(() => patch()).to.not.throw();

    const after = Object.getOwnPropertyDescriptor(Layer.prototype, "handle");
    expect(after).to.deep.equal(before);
  });

  it("stays idempotent after the Express 5 no-op", () => {
    expect(() => patch()).to.not.throw();
  });
});

describe("maestro.patch() with Express 4", () => {
  before(() => {
    __setExpressMajorForTests(null);
    __resetPatchFlagForTests();
    patch();
  });

  it("forwards thrown errors from async routes without maestro()", async () => {
    const app = express();
    app.get("/throw", async (_req, _res) => {
      throw new Error("boom");
    });
    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(500).json({ error: err.message });
      }
    );

    const res = await request(app).get("/throw");
    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal("boom");
  });

  it("forwards rejected promises from async routes without maestro()", async () => {
    const app = express();
    app.get("/reject", async (_req, _res) => {
      await Promise.reject(new Error("rejected"));
    });
    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(500).json({ error: err.message });
      }
    );

    const res = await request(app).get("/reject");
    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal("rejected");
  });

  it("is idempotent when called twice", () => {
    expect(() => {
      patch();
      patch();
    }).to.not.throw();
  });

  it("still works with explicit maestro() wrapper", async () => {
    const app = express();
    app.get(
      "/wrapped",
      maestro(async (_req, res) => {
        res.status(200).json({ ok: true });
      })
    );

    const res = await request(app).get("/wrapped");
    expect(res.status).to.equal(200);
    expect(res.body.ok).to.equal(true);
  });

  it("forwards errors from async middleware (not only routes)", async () => {
    const app = express();
    app.use(async (_req, _res, _next) => {
      throw new Error("middleware boom");
    });
    app.get("/ok", (_req, res) => {
      res.send("ok");
    });
    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(500).json({ error: err.message });
      }
    );

    const res = await request(app).get("/ok");
    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal("middleware boom");
  });

  it("does not break successful responses after patch", async () => {
    const app = express();
    app.get("/ok", async (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(app).get("/ok");
    expect(res.status).to.equal(200);
    expect(res.body.ok).to.equal(true);
  });

  it("preserves handler arity so Express still detects error middleware", async () => {
    const app = express();
    app.get("/x", async () => {
      throw new Error("x");
    });

    const errorHandler = (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      res.status(503).json({ error: err.message });
    };
    expect(errorHandler.length).to.equal(4);
    app.use(errorHandler);

    const res = await request(app).get("/x");
    expect(res.status).to.equal(503);
  });

  it("forwards thrown errors from async app.param callbacks", async () => {
    const app = express();

    app.param("id", async (_req, _res, next, id) => {
      if (id === "bad") {
        throw new Error("bad id");
      }
      next();
    });

    app.get("/items/:id", (req, res) => {
      res.status(200).json({ id: req.params.id });
    });

    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(400).json({ error: err.message });
      }
    );

    const fail = await request(app).get("/items/bad");
    expect(fail.status).to.equal(400);
    expect(fail.body.error).to.equal("bad id");

    const ok = await request(app).get("/items/42");
    expect(ok.status).to.equal(200);
    expect(ok.body.id).to.equal("42");
  });

  it("forwards rejected promises from async app.param callbacks", async () => {
    const app = express();

    app.param("slug", async (_req, _res, next, slug) => {
      if (slug === "nope") {
        await Promise.reject(new Error("slug rejected"));
      }
      next();
    });

    app.get("/posts/:slug", (req, res) => {
      res.status(200).json({ slug: req.params.slug });
    });

    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(422).json({ error: err.message });
      }
    );

    const res = await request(app).get("/posts/nope");
    expect(res.status).to.equal(422);
    expect(res.body.error).to.equal("slug rejected");
  });
});
