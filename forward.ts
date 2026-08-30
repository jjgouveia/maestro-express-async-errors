/**
 * Shared promise/thenable forwarding.
 *
 * `runWithNext` is for explicit maestro() wrappers (sync throw + rejection).
 * `catchThenables` is for Layer/param patch (preserve sync throw semantics of Express).
 */

export function catchThenables(
  ret: unknown,
  next: (err: unknown) => void
): unknown {
  if (ret != null && typeof (ret as { catch?: unknown }).catch === "function") {
    (ret as Promise<unknown>).catch(next);
  }
  return ret;
}

export function runWithNext(
  work: () => unknown,
  next: (err: unknown) => void
): unknown {
  try {
    return Promise.resolve(work()).catch(next);
  } catch (err) {
    next(err);
  }
}
