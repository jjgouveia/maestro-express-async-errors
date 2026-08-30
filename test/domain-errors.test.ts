"use strict";

import { expect } from "chai";
import express from "express";
import request from "supertest";
import { maestro, type ErrorCallback } from "../index";
import { jsonErrorHandler } from "./helpers";

class UserNotFoundError extends Error {
  readonly code = "USER_NOT_FOUND" as const;
  readonly statusCode = 404;
  readonly userId: string;

  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.name = "UserNotFoundError";
    this.userId = userId;
  }
}

class PaymentFailedError extends Error {
  readonly code = "PAYMENT_FAILED" as const;
  readonly statusCode = 402;
  readonly reason: "insufficient_funds" | "gateway";

  constructor(message: string, reason: "insufficient_funds" | "gateway") {
    super(message);
    this.name = "PaymentFailedError";
    this.reason = reason;
  }
}

describe("typed domain errors with maestro.from", () => {
  it("narrows err so domain fields are available in the handler", () => {
    const seen: { userId?: string; code?: string } = {};

    const handler: ErrorCallback<UserNotFoundError> = (
      err,
      _req,
      _res,
      _next
    ) => {
      seen.userId = err.userId;
      seen.code = err.code;
    };

    const middleware = maestro.from(UserNotFoundError, handler);
    middleware(new UserNotFoundError("u-42"), {} as any, {} as any, () => {
      throw new Error("should not fall through");
    });

    expect(seen).to.deep.equal({ userId: "u-42", code: "USER_NOT_FOUND" });
  });

  it("maps typed domain errors to HTTP responses in Express", async () => {
    const app = express();

    app.get(
      "/users/:id",
      maestro(async (req) => {
        throw new UserNotFoundError(req.params.id);
      })
    );

    app.post(
      "/pay",
      maestro(async () => {
        throw new PaymentFailedError("card declined", "gateway");
      })
    );

    app.use(
      maestro.from(UserNotFoundError, (err, _req, res) => {
        res.status(err.statusCode).json({
          code: err.code,
          userId: err.userId,
          message: err.message,
        });
      })
    );

    app.use(
      maestro.from(PaymentFailedError, (err, _req, res) => {
        res.status(err.statusCode).json({
          code: err.code,
          reason: err.reason,
          message: err.message,
        });
      })
    );

    app.use(jsonErrorHandler(500));

    const missing = await request(app).get("/users/abc");
    expect(missing.status).to.equal(404);
    expect(missing.body).to.deep.equal({
      code: "USER_NOT_FOUND",
      userId: "abc",
      message: "User abc not found",
    });

    const pay = await request(app).post("/pay");
    expect(pay.status).to.equal(402);
    expect(pay.body).to.deep.equal({
      code: "PAYMENT_FAILED",
      reason: "gateway",
      message: "card declined",
    });
  });
});
