/**
 * Compile-only checks for maestro.from generics.
 * Run via: npm run test:types
 */
import { maestro, type ErrorCallback } from "../index";

class UserNotFoundError extends Error {
  readonly code = "USER_NOT_FOUND" as const;
  userId: string;
  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.userId = userId;
  }
}

class PaymentError extends Error {
  readonly code = "PAYMENT_FAILED" as const;
}

const typed: ErrorCallback<UserNotFoundError> = (err) => {
  const id: string = err.userId;
  const code: "USER_NOT_FOUND" = err.code;
  void id;
  void code;
};

maestro.from(UserNotFoundError, typed);

maestro.from(UserNotFoundError, (err) => {
  const id: string = err.userId;
  void id;
});

// Negative: ErrorCallback<UserNotFoundError> must not accept PaymentError parameter type
// @ts-expect-error PaymentError is not assignable to UserNotFoundError callback param
const _wrongHandler: ErrorCallback<UserNotFoundError> = (_err: PaymentError) => {};

maestro.from(PaymentError, (err) => {
  // @ts-expect-error userId does not exist on PaymentError
  void err.userId;
});
