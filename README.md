# Maestro for Express async errors

TypeScript-first helpers so rejected promises and thrown errors in Express handlers reach your error middleware.

**Zero runtime dependencies.** Peer: `express` `>=4.16.2`.

## When to use

| Setup | Recommendation |
| --- | --- |
| **Express 4** | Use `maestro()` / `asyncHandler`, or opt-in global patch via `register` |
| **Express 5** | Async errors are native — wrappers are optional; `maestro.from` still helps for domain errors |
| **New projects** | Prefer Express 5; keep Maestro only if you want typed domain error routing |

## Install

```bash
npm install maestro-express-async-errors
```

Node.js `>=18`.

## Three modes

### 1. Per-route wrapper (Express 4 and 5)

Drop-in compatible with [`express-async-handler`](https://www.npmjs.com/package/express-async-handler):

```ts
import { maestro, asyncHandler } from "maestro-express-async-errors";

app.get(
  "/users/:id",
  maestro(async (req, res) => {
    const user = await repository.getById(req.params.id);
    if (!user) throw new UserNotFoundError();
    res.json(user);
  })
);

// alias
app.get("/health", asyncHandler(async (_req, res) => {
  res.send("ok");
}));
```

### 2. Batch wrap — `maestro.all`

```ts
app.post("/products", ...maestro.all([validationFn, createProductFn]));
```

### 3. Global patch (Express 4 only) — opt-in

Same DX as [`express-async-errors`](https://www.npmjs.com/package/express-async-errors). **Does nothing on Express 5+** (native promise support; patching would risk double `next(err)`).

```ts
import "maestro-express-async-errors/register";
// or: import { maestro } from "maestro-express-async-errors"; maestro.patch();

app.get("/users", async (req, res) => {
  res.json(await User.findAll());
});
```

> Patch touches Express 4 router internals. After upgrading to Express 5, remove the `register` import.

## Domain errors — `maestro.from`

```ts
app.use(
  maestro.from(UserNotFoundError, (err, req, res, next) => {
    res.status(404).json({ error: err.message });
  })
);

app.use((err, req, res, next) => {
  res.status(500).json({ error: "internal" });
});
```

Unmatched errors fall through to the next error middleware.

## Compared to alternatives

- **express-async-handler** — same per-route wrap idea; Maestro adds TypeScript types, `maestro.from`, and `maestro.all`.
- **express-async-errors** — same global-patch idea on Express 4; Maestro’s patch is opt-in (`/register`), no-op on Express 5, and ships with the wrapper API in one package.

## Presence checklist (maintainers)

- [ ] Publish / refresh [docs/why-maestro.md](docs/why-maestro.md) (Dev.to or blog)
- [ ] Confirm NPM package description after release
- [ ] Triage open GitHub issues/PRs
- [ ] See [docs/publishing.md](docs/publishing.md) for OIDC release setup

## License

MIT
