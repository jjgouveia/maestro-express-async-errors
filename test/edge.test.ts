"use strict";

import { expect } from "chai";
import sinon from "sinon";
import express from "express";
import request from "supertest";
import { maestro } from "../index";
import { jsonErrorHandler } from "./helpers";

describe("maestro edge cases", () => {
  it("forwards non-Error rejection values to next", async () => {
    const next = sinon.spy();
    const handler = maestro(async () => {
      return Promise.reject("string-rejection");
    });

    await handler({}, {}, next);
    expect(next).to.have.been.calledWith("string-rejection");
  });

  it("forwards sync throws inside the async wrapper to next", async () => {
    const next = sinon.spy();
    const error = new Error("sync boom");
    const handler = maestro((_req: any, _res: any, _next: any) => {
      throw error;
    });

    await handler({}, {}, next);
    expect(next).to.have.been.calledWith(error);
  });

  it("does not call next on successful resolve", async () => {
    const next = sinon.spy();
    const handler = maestro(async (_req: any, res: any) => {
      res.status = 200;
    });
    const res = { status: 0 };

    await handler({}, res, next);
    expect(next).not.to.have.been.called;
    expect(res.status).to.equal(200);
  });

  it("maestro.all with empty array returns empty array", () => {
    expect(maestro.all([])).to.deep.equal([]);
  });

  it("maestro.all wraps each fn so rejections reach next", async () => {
    const next = sinon.spy();
    const error = new Error("second failed");
    const [first, second] = maestro.all([
      async (_req: any, _res: any, _next: any) => undefined,
      async (_req: any, _res: any, _next: any) => {
        throw error;
      },
    ]);

    await first({}, {}, next);
    expect(next).not.to.have.been.called;

    await second({}, {}, next);
    expect(next).to.have.been.calledWith(error);
  });
});

describe("maestro.from edge cases", () => {
  class NotFound extends Error {}
  class NotFoundChild extends NotFound {}
  class ValidationError extends Error {}

  const req = {} as express.Request;
  const res = {} as express.Response;

  it("matches subclasses of the given constructor", () => {
    const matched = sinon.spy();
    const next = sinon.spy();

    maestro.from(NotFound, matched)(new NotFoundChild(), req, res, next);

    expect(matched).to.have.been.calledOnce;
    expect(next).not.to.have.been.called;
  });

  it("falls through a chain until a matching from handler", () => {
    const validation = sinon.spy();
    const notFound = sinon.spy();
    const next = sinon.spy();

    const stack = [
      maestro.from(ValidationError, validation),
      maestro.from(NotFound, notFound),
    ];

    const err = new NotFound("missing");
    stack[0](err, req, res, (passed) => {
      stack[1](passed as Error, req, res, next);
    });

    expect(validation).not.to.have.been.called;
    expect(notFound).to.have.been.calledOnce;
    expect(next).not.to.have.been.called;
  });

  it("passes unmatched errors all the way to the final next", () => {
    const validation = sinon.spy();
    const notFound = sinon.spy();
    const finalNext = sinon.spy();
    const err = new Error("unknown");

    const stack = [
      maestro.from(ValidationError, validation),
      maestro.from(NotFound, notFound),
    ];

    stack[0](err, req, res, (passed) => {
      stack[1](passed as Error, req, res, finalNext);
    });

    expect(validation).not.to.have.been.called;
    expect(notFound).not.to.have.been.called;
    expect(finalNext).to.have.been.calledWith(err);
  });
});

describe("maestro.from with Express integration", () => {
  class UserNotFoundError extends Error {}
  class PaymentError extends Error {}

  function buildApp() {
    const app = express();

    app.get(
      "/users/:id",
      maestro(async (req, _res) => {
        if (req.params.id === "missing") {
          throw new UserNotFoundError("user missing");
        }
        if (req.params.id === "pay") {
          throw new PaymentError("payment failed");
        }
        if (req.params.id === "boom") {
          throw new Error("unexpected");
        }
        throw new Error("unreachable");
      })
    );

    app.use(
      maestro.from(UserNotFoundError, (err, _req, res, _next) => {
        res.status(404).json({ error: err.message });
      })
    );

    app.use(
      maestro.from(PaymentError, (err, _req, res, _next) => {
        res.status(402).json({ error: err.message });
      })
    );

    app.use(jsonErrorHandler(500));

    return app;
  }

  it("maps UserNotFoundError to 404", async () => {
    const res = await request(buildApp()).get("/users/missing");
    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal("user missing");
  });

  it("maps PaymentError to 402 without hitting the generic handler", async () => {
    const res = await request(buildApp()).get("/users/pay");
    expect(res.status).to.equal(402);
    expect(res.body.error).to.equal("payment failed");
  });

  it("falls through to generic 500 for unknown errors", async () => {
    const res = await request(buildApp()).get("/users/boom");
    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal("unexpected");
  });
});
