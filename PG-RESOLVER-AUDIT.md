# Postgres Addon/Attachment Resolver Audit

This document audits every mechanism in the Heroku CLI that resolves a Postgres add-on or add-on attachment identifier (name, id, config var, or `app::identifier`) into a concrete resource, and lists every call site grouped by resolver type.

There are **four** distinct resolver implementations in active use, plus one manual client-side filter kept for comparison. They are not interchangeable: they return different shapes, throw different error types, and some are Postgres-specific while others are generic add-on resolvers reused by Postgres commands.

As of the `v12.0.0` branch, `@heroku/sdk` (`^0.12.0`) adds three more resolvers meant to consolidate and eventually replace the four below (see [§6](#6-herokusdk-resolvers-new-v1200)). This migration is already underway: `addons/open.ts`, `addons/wait.ts`, `addons/docs.ts`, `data/pg/quotas/*`, and `data/pg/attachments/*` already call the SDK resolvers directly, and `pg/backups/*` already resolves through the internal `resolvePgDatabase` indirectly via SDK composites (`data.database.describe`, `data.backup.captureAndWait`, `data.restore.restoreAndWait`). Most of the legacy `pg:*` namespace and several `data:pg:*` commands have not migrated yet and still use the four resolvers below. [Migration Strategy](#migration-strategy) maps each old resolver to its SDK counterpart, including one confirmed gap.

**Note on sections 1–5 below**: their call-site tables were captured before this branch's SDK adoption began and have not been re-verified against `v12.0.0` — some entries (e.g. `addons/open.ts`, `addons/wait.ts`, `addons/docs.ts`, `pg/backups/*`, `data/pg/quotas/*`, `data/pg/attachments/index.ts` and `attachments/destroy.ts`) have since migrated to the SDK resolvers described in §6 and no longer call the resolver listed for them below. Treat §6/Migration Strategy as the authoritative current state for those files.

## Summary table

| # | Resolver | Source | Returns | Used by |
|---|----------|--------|---------|---------|
| 1 | `resolveAddon` / `addonResolver` / `attachmentResolver` | `src/lib/addons/resolve.ts` (CLI-local) | `ExtendedAddon` / `AddOnAttachment` | generic `addons:*` commands, 1 `pg:*` command |
| 2 | `utils.AddonResolver` | `@heroku/heroku-cli-util` (`utils/addons/addon-resolver.js`) | `ExtendedAddon` | `addons:destroy`, all `data:pg:*` commands |
| 3 | `utils.pg.DatabaseResolver` | `@heroku/heroku-cli-util` (`utils/pg/databases.js`) | `ConnectionDetails` / `ExtendedAddonAttachment` | all legacy `pg:*` commands, 3 `data:pg:*` commands, 1 `pg:links` command |
| 4 | `AddonAttachmentResolver` | `@heroku/heroku-cli-util` (`utils/addons/attachment-resolver.js`) | `ExtendedAddonAttachment` | internal to `DatabaseResolver` (#3) only; no direct CLI call sites |
| 5 | `makeAddonsFilter` | `src/lib/redis/api.ts` (CLI-local, Redis-only) | manual array filter, no resolve endpoint | `redis:*` commands only (listed for contrast, not Postgres) |

---

## 1. CLI-local `src/lib/addons/resolve.ts`

Hand-rolled resolver predating the heroku-cli-util equivalents. Talks directly to `POST /actions/addons/resolve` and `POST /actions/addon-attachments/resolve` via `APIClient`. Exports:

- `appAddon(heroku, app, id, options)` — resolve scoped to an app.
- `addonResolver(heroku, app, id, options)` — tries app-scoped lookup, falls back to global lookup on 404.
- `resolveAddon(...)` — memoizing wrapper around `addonResolver` (caches in-flight/resolved promises by `app|id|addon_service` key).
- `appAttachment(heroku, app, id, options)` / `attachmentResolver(...)` — attachment equivalents of the above.
- Throws local `NotFound` / `AmbiguousError` classes.

### Call sites

| File | Function used |
|------|----------------|
| `src/commands/addons/info.ts:27` | `resolveAddon` |
| `src/commands/addons/open.ts:102,113` | `attachmentResolver`, `resolveAddon` |
| `src/commands/addons/wait.ts:30` | `resolveAddon` |
| `src/commands/addons/docs.ts:29` | `resolveAddon` |
| `src/commands/addons/upgrade.ts` | `addonResolver` (uncached, direct) |
| `src/commands/pg/links/create.ts:34` | `addonResolver` (to resolve the *remote* link target, which may be Postgres or Redis — paired with resolver #3 for the primary database) |

This is the only resolver family exercised by generic `addons:*` commands, and it is Postgres-agnostic (it resolves any add-on type). It overlaps with resolver #2 below in purpose but is not the same implementation — `addons:destroy` uses #2 while the rest of `addons:*` uses this one.

---

## 2. `utils.AddonResolver` (heroku-cli-util)

Class from `@heroku/heroku-cli-util`'s `utils/addons/addon-resolver.js`. Same `/actions/addons/resolve` endpoint as #1, but packaged as a class (`new utils.AddonResolver(heroku).resolve(addon, app?, addonService?)`) and shipped as part of the shared library rather than CLI-local code. This is the resolver standardized on by the newer `data:pg:*` command namespace and is what is typically paired with `utils.pg.addonService()` to scope resolution to `heroku-postgresql`.

### Call sites

| File | Line |
|------|------|
| `src/commands/addons/destroy.ts` | `new utils.AddonResolver(this.heroku)` |
| `src/commands/data/pg/info.ts:41` | `addonResolver.resolve(database, app, utils.pg.addonService())` |
| `src/commands/data/pg/settings.ts:67` | same pattern |
| `src/commands/data/pg/destroy.ts:30` | same pattern |
| `src/commands/data/pg/fork.ts:111` | same pattern |
| `src/commands/data/pg/upgrade/run.ts` | uses `DatabaseResolver` instead (see #3) — **inconsistent with its siblings** |
| `src/commands/data/pg/quotas/index.ts:33` | same pattern |
| `src/commands/data/pg/quotas/update.ts:66` | same pattern |
| `src/commands/data/pg/update.ts:263` | same pattern |
| `src/commands/data/pg/attachments/index.ts:33` | same pattern |
| `src/commands/data/pg/attachments/destroy.ts:28` | same pattern (resolves the add-on behind an attachment fetched manually first) |
| `src/commands/data/pg/credentials/index.ts:37` | same pattern |
| `src/commands/data/pg/credentials/url.ts:45` | same pattern |
| `src/commands/data/pg/credentials/rotate.ts:44` | same pattern |
| `src/commands/data/pg/credentials/create.ts:32` | same pattern |

Every one of these pairs the resolve call with `utils.pg.isAdvancedDatabase(addon)` and errors out (`ux.error(...)`) if the resolved add-on isn't Advanced-tier — i.e. this resolver returns *any* add-on and tier-gating is the caller's responsibility, repeated ~12 times nearly verbatim.

---

## 3. `utils.pg.DatabaseResolver` (heroku-cli-util)

Class from `@heroku/heroku-cli-util`'s `utils/pg/databases.js`. The Postgres-specific resolver: understands legacy/classic multi-database apps, `DATABASE_URL` defaulting, credential namespaces, and raw connection strings. Key methods:

- `getDatabase(appId, attachmentId?, namespace?)` → `ConnectionDetails` (adds tunnel/connection info; used by anything that shells out to `psql` or opens a tunnel).
- `getAttachment(appId, attachmentId?, namespace?)` → `ExtendedAddonAttachment` (lighter weight; used when only add-on metadata is needed).
- `getAllLegacyDatabases(app)` / `getArbitraryLegacyDB(app)` — classic multi-database-per-app fallback paths.
- `static parsePostgresConnectionString(str)` — parses a raw connection string or bare db name without hitting the API at all.

Internally, `getAttachment` delegates to resolver #4 (`AddonAttachmentResolver`) and additionally searches config var names client-side when the resolver endpoint doesn't find a match (see its docstring in `databases.d.ts`).

### Call sites — legacy `pg:*` namespace (dominant pattern, `getDatabase`)

Used wherever a `psql` session or tunnel is needed:

`src/commands/pg/total-index-size.ts`, `total-table-size.ts`, `table-indexes-size.ts`, `index-usage.ts`, `index-size.ts`, `table-size.ts`, `calls.ts`, `ps.ts`, `user-connections.ts`, `seq-scans.ts`, `extensions.ts`, `blocking.ts`, `fdwsql.ts`, `outliers.ts`, `mandelbrot.ts`, `locks.ts`, `long-running-queries.ts`, `bloat.ts`, `cache-hit.ts`, `records-rank.ts`, `unused-indexes.ts`, `vacuum-stats.ts`, `kill.ts`, `psql.ts`, `push.ts` (target side), `pull.ts` (source side).

### Call sites — legacy `pg:*` namespace (`getAttachment`, metadata only)

`src/commands/pg/info.ts`, `unfollow.ts`, `diagnose.ts`, `killall.ts`, `copy.ts`, `reset.ts`, `promote.ts`, `stats-reset.ts`, `settings/index.ts`, `upgrade/prepare.ts`, `upgrade/dryrun.ts`, `upgrade/run.ts`, `upgrade/cancel.ts`, `links/destroy.ts`, `links/create.ts`, `links/index.ts`, `backups/capture.ts`, `backups/schedule.ts`, `backups/unschedule.ts`, `backups/restore.ts`, `credentials.ts`, `credentials/rotate.ts`, `credentials/repair-default.ts`, `credentials/create.ts`, `credentials/destroy.ts`, `credentials/url.ts`, `connection-pooling/attach.ts`, `wait.ts`, `upgrade/wait.ts`.

### Call sites — `getAllLegacyDatabases` / `getArbitraryLegacyDB`

`src/commands/pg/info.ts`, `wait.ts`, `links/index.ts` (all-databases fallback when no `database` arg given), `backups/schedules.ts`, `backups/unschedule.ts` (arbitrary single-db fallback).

### Call sites — `data:pg:*` namespace (minority; inconsistent with resolver #2)

| File | Method |
|------|--------|
| `src/commands/data/pg/wait.ts:52-53` | `getAttachment` (imported directly as `DatabaseResolver` from `@heroku/heroku-cli-util/utils`, not via the `utils.pg.*` namespace import style the rest of the file uses) |
| `src/commands/data/pg/psql.ts:46-47` | `getDatabase` |
| `src/commands/data/pg/upgrade/run.ts:37-38` | `getAttachment` |

These three `data:pg:*` commands diverge from the rest of their own namespace (which standardizes on resolver #2, `utils.AddonResolver`) — likely because they need `psql`/tunnel support (`psql.ts`) or legacy attachment semantics (`wait.ts`, `upgrade/run.ts`) that resolver #2 doesn't provide.

### Non-resolving helper usage (not a resolve call, but tightly coupled)

`DatabaseResolver.parsePostgresConnectionString` is used as a pure parser (no API call) in `src/commands/pg/push.ts:103`, `pull.ts:109`, `copy.ts:16`, and `src/lib/pg/util.ts:125`.

`utils.pg.PsqlService`, `utils.pg.psql.getPsqlConfigs/sshTunnel`, `utils.pg.host()`, and the tier-check predicates (`isAdvancedDatabase`/`isEssentialDatabase`/`isLegacyEssentialDatabase`/`isLegacyDatabase`/`isPostgresAddon`/`isPrivateNetworkDatabase`) are downstream consumers of whatever a resolver (#2 or #3) returned — listed here because they're the reason so many commands need the *attachment* shape from #3 rather than the plain add-on shape from #2.

---

## 4. `AddonAttachmentResolver` (heroku-cli-util)

Class from `utils/addons/attachment-resolver.js`. Thin wrapper over `POST /actions/addon-attachments/resolve` (same endpoint as CLI-local `attachmentResolver` in #1, different implementation). No command in `src/` calls this directly — it is only reachable as a private implementation detail of `utils.pg.DatabaseResolver` (#3)'s `getAttachmentsViaResolver` method.

---

## 5. `makeAddonsFilter` (Redis, for contrast only)

`src/lib/redis/api.ts:153` — a manual, client-side array filter (list all add-ons on the app, then `startsWith`/substring-match by service name and optional database filter) with no dedicated resolve endpoint call. Used by `src/commands/redis/promote.ts:25` and internally within `api.ts` itself. Not a Postgres resolver, but included for contrast: it's the same "resolve by listing and filtering client-side" shape that a generic SDK-level resolver would eventually need to replace for Redis, mirroring the Postgres consolidation opportunity described below.

---

## 6. `@heroku/sdk` Resolvers (new, `v12.0.0`)

`@heroku/sdk` ships three resolver functions that consolidate the four resolver implementations above into one canonical implementation per resolution *shape* (add-on identity, attachment identity, Postgres-database-via-attachment). All three take an SDK `ctx` (`Pick<ResourceCtx, 'platform'>`) rather than the raw `APIClient` the old resolvers took.

### 6a. `resolveAddon`

- Source: `resources/platform/add-on/resolve.ts`. Also exposed as `platform.addOn.resolve(addonIdentity, options?)` when the SDK is constructed with `addOnExtensions` (`@heroku/sdk/extensions/platform`). Publicly importable (`./resources/platform/add-on`).
- Signature: `resolveAddon(ctx, addonIdentity, options?: {addonService?, appIdentity?}) => Promise<ResolvedAddOn>`.
- Accepts an add-on UUID, globally-unique add-on name, add-on service slug, or add-on plan slug — and, with `appIdentity`, an attachment UUID/name/config var, or an app-prefixed `app::identifier`.
- `addonService` is filtered client-side (the platform's server-side filter excludes alpha add-ons).
- Throws `AddonNotFoundError` / `AddonAmbiguousError`.
- **Replaces resolver #1** (`addonResolver`/`resolveAddon`) **and resolver #2** (`utils.AddonResolver`) — both resolved by add-on identity. Confirmed status on `v12.0.0`:
  - **Direct `platform.addOn.resolve(...)` calls**: `addons/open.ts:133`, `addons/wait.ts:33`, `addons/docs.ts:29`, `data/pg/quotas/index.ts:33`, `data/pg/quotas/update.ts:62`, `data/pg/attachments/index.ts:34`, `data/pg/attachments/destroy.ts:31`.
  - **Indirect, via a composite that resolves internally** (`describe.js`/`upgrade.js` both import `resolve.js`): `addons/info.ts:29` (`platform.addOn.describe`), `addons/upgrade.ts:109` (`platform.addOn.upgrade`).
  - **Not yet migrated**: `addons/destroy.ts:37` (`utils.AddonResolver`), `pg/links/create.ts:34` (CLI-local `addonResolver`), `data/pg/info.ts:40`, `settings.ts:66`, `destroy.ts:29`, `fork.ts:110`, `update.ts:262`, `attachments/create.ts:53`, `credentials/index.ts:36`, `credentials/url.ts:44`, `credentials/rotate.ts:43`, `credentials/create.ts:31`, `credentials/destroy.ts:38` (all still `utils.AddonResolver`).

### 6b. `resolveAddonAttachment`

- Source: `resources/platform/add-on-attachment/resolve.ts`. Also exposed as `platform.addOnAttachment.resolve(appIdentity, attachmentName, options?)` via `addOnAttachmentExtensions` — the *only* method that extension adds; other `platform.addOnAttachment.*` calls (e.g. `infoByApp`, `listByAddOn`, `delete`) are plain route-derived methods, not resolve calls. Publicly importable (`./resources/platform/add-on-attachment`).
- Signature: `resolveAddonAttachment(ctx, appIdentity, attachmentName, options?: {addonService?, signal?}) => Promise<ResolvedAddOnAttachment>`.
- Accepts an attachment UUID, attachment name, config var, app-scoped name/config var (`app::DATABASE`), or a globally-unique add-on name.
- Always sends `Accept-Inclusion: addon:plan,config_vars`, so the returned attachment carries its add-on's plan and its own config var names without a second call.
- Throws `AddonAttachmentNotFoundError` / `AddonAttachmentAmbiguousError`.
- Its docstring draws the line explicitly: "To resolve just the add-on the attachment points to, use `resolveAddon`."
- **Replaces resolver #4** (`AddonAttachmentResolver`) — same resolution shape, by attachment identity. Confirmed status on `v12.0.0`: **one direct call site**, `addons/open.ts:108` (`platform.addOnAttachment.resolve(app, addon)`). `data/pg/attachments/destroy.ts:30`'s `platform.addOnAttachment.infoByApp(...)` is a plain lookup by already-known app+name, not a resolve call, so it doesn't count — that command's actual resolution step is the `resolveAddon` call at line 31 (see §6a). Resolver #4 itself still has no direct callers, same as in §4.

### 6c. `resolvePgDatabase`

- Source: `resources/data/internal/resolve-pg-database.ts`. **Intentionally internal, not a public resolver CLI code can call.** The package's `exports` map blocks the whole path (`"./resources/data/internal/*": null`) — this is deliberate, so that Postgres resolution happens exactly once, inside the SDK's own data composites, rather than being callable ad hoc from command code.
- Confirmed internal consumers: `data/database.js` (`database.describe`), `data/postgres-database.js` (`postgresDatabase.listCredentials`), `data/transfer-schedule.js`, `data/maintenance.js`, `data/transfer/capture-and-wait.js` (`backup.captureAndWait`), and `data/transfer/restore-and-wait.js` (`restore.restoreAndWait`). Each of these composites takes a plain `appIdentity`/`addonIdentity` string pair and resolves internally — the caller never sees a separate resolve step.
- Overloaded signature:
  - `resolvePgDatabase(ctx, appIdentity, options: {...ResolveAddonAttachmentOptions, includeAttachment: true, input?}) => Promise<{addon: ResolvedPgDatabase, attachment: ResolvedAddOnAttachment}>`
  - `resolvePgDatabase(ctx, appIdentity, options?) => Promise<ResolvedPgDatabase>` — the add-on identity nested on the attachment, not a full `ResolvedAddOn`; call `resolveAddon` with its `id` to get that shape.
- `input` resolution (the Postgres-specific value-add over plain `resolveAddonAttachment`): omitted/`''` → `DATABASE_URL` on `appIdentity`; `parent-app::attachment-or-config-var` → attachment/config var on `parent-app`; `parent-app::branch-name` → branch add-on name on `parent-app`; anything else → routed through `resolveAddonAttachment` scoped to `appIdentity`. Matches that resolve to the same database are treated as equivalent, not ambiguous. Falls back to treating `input` as a literal config var name if the resolve endpoint finds nothing.
- Throws `PgDatabaseNotFoundError` (deliberately, not a bare `NotFoundError`) so a caller pairing this with a second data call (e.g. `data.database.info(addon.id)`) can tell a resolution failure apart from that second call's own 404. Also throws `AddonAttachmentAmbiguousError` for genuinely ambiguous matches, or a plain `Error` if `appIdentity` is empty with no `::`-prefixed fallback in `input`.
- Built on `resolveAddonAttachment`, not `resolveAddon` — its docstring: "This function intentionally relies on the attachment resolve endpoint. To resolve a database through the add-on resolve endpoint, call `resolveAddon` directly."
- **Replaces resolver #3's `getAttachment`** — same resolution shape (attachment identity with Postgres-aware fallbacks), but only reachable by calling the SDK data composite for the actual operation, never directly. Confirmed status on `v12.0.0`:
  - **Already live, via composites**: `pg/backups/capture.ts` (`data.database.describe`, `data.backup.captureAndWait`), `pg/backups/restore.ts` (`data.restore.restoreAndWait`), `pg/backups/schedule.ts` (`data.database.describe`), `pg/backups/schedules.ts` / `unschedule.ts` (`transferScheduleExtensions` composites). None of these commands call a resolver explicitly — they pass a raw `app`/`database` identity straight to the composite, which resolves internally.
  - **Not yet migrated** (still `utils.pg.DatabaseResolver.getAttachment`): `pg/credentials.ts:35`, `data/pg/wait.ts:53`, `data/pg/upgrade/run.ts:38`, and every other `getAttachment` call site listed in §3 (`pg/info.ts`, `unfollow.ts`, `diagnose.ts`, `killall.ts`, `copy.ts`, `reset.ts`, `promote.ts`, `stats-reset.ts`, `settings/index.ts`, `upgrade/prepare.ts`, `upgrade/dryrun.ts`, `upgrade/run.ts`, `upgrade/cancel.ts`, `links/destroy.ts`, `links/create.ts`, `links/index.ts`, `credentials/rotate.ts`, `credentials/repair-default.ts`, `credentials/create.ts`, `credentials/destroy.ts`, `credentials/url.ts`, `connection-pooling/attach.ts`, `wait.ts`, `upgrade/wait.ts`).

---

## Migration Strategy

There is no single historical "concrete method" for resolving a Postgres database — some commands resolved by add-on identity (#1, #2), others by attachment identity (#3's `getAttachment`, #4), and one (#3's `getDatabase`) needed tunnel/connection details no resolve endpoint returns at all. Because of that inconsistency, the migration rule is **not** "every Postgres command moves to the same SDK resolver" — it's **preserve the resolution method the original command used**:

| Original resolver | Resolution method | → SDK resolver | Status on `v12.0.0` |
|---|---|---|---|
| #1 CLI-local `resolveAddon`/`addonResolver` | by add-on identity | `resolveAddon` | **Partially migrated.** Direct calls in `addons/open.ts`, `addons/wait.ts`, `addons/docs.ts`; indirect (via composite) in `addons/info.ts`, `addons/upgrade.ts`. `pg/links/create.ts`'s use of `addonResolver` for the link target is not migrated. |
| #1 CLI-local `attachmentResolver` | by attachment identity | `resolveAddonAttachment` | **Migrated at its one call site**, `addons/open.ts`. |
| #2 `utils.AddonResolver` (+ manual `isAdvancedDatabase` check) | by add-on identity | `resolveAddon` | **Partially migrated.** Direct calls in `data/pg/quotas/index.ts`, `quotas/update.ts`, `attachments/index.ts`, `attachments/destroy.ts`. Not migrated: `addons/destroy.ts`, `data/pg/info.ts`, `settings.ts`, `destroy.ts`, `fork.ts`, `update.ts`, `attachments/create.ts`, `credentials/index.ts`, `credentials/url.ts`, `credentials/rotate.ts`, `credentials/create.ts`, `credentials/destroy.ts`. `resolveAddon` returns any add-on, same as today — tier-gating stays caller-side unless/until a composite absorbs the repeated check this file already flagged as a consolidation target. |
| #3 `DatabaseResolver.getAttachment` | by attachment identity, Postgres-aware (`DATABASE_URL` default, branch names, config var fallback) | `resolvePgDatabase`, reached only via a composite (never called directly — see §6c) | **Partially migrated.** `pg/backups/capture.ts`, `restore.ts`, `schedule.ts`, `schedules.ts`, `unschedule.ts` resolve through composites (`data.database.describe`, `data.backup.captureAndWait`, `data.restore.restoreAndWait`, `transferScheduleExtensions`) instead of calling a resolver. Every other `getAttachment` call site from §3 (e.g. `pg/credentials.ts`, `data/pg/wait.ts`, `data/pg/upgrade/run.ts`, `pg/info.ts`, `pg/links/*`, `pg/upgrade/*`) is still on the old resolver. |
| #3 `DatabaseResolver.getDatabase` | by attachment identity, **plus** tunnel/connection details | **No SDK equivalent** | Not migrated — see gap below. |
| #3 `getAllLegacyDatabases` / `getArbitraryLegacyDB` | classic multi-database-per-app fallback | **No SDK equivalent** | Not migrated — same gap family as `getDatabase`, a shape none of the three SDK resolvers express. |
| #3 `parsePostgresConnectionString` | pure parsing, no API call | *(no resolver involved)* | Not a resolve call; nothing to migrate. |
| #4 `AddonAttachmentResolver` | by attachment identity | `resolveAddonAttachment` | N/A — resolver #4 itself was never called directly (§4), so there's no old call site to migrate. Its SDK analog's one direct caller (`addons/open.ts`) arrived independently, not as a migration of an existing #4 call site. |

### Gap: no SDK equivalent of `DatabaseResolver.getDatabase()`

`getDatabase()` is resolver #3's dominant call pattern — it backs every legacy `pg:*` command that shells out to `psql` or opens a tunnel (the full list is in [§3](#3-utilspg-databaseresolver-heroku-cli-util)). It returns `ConnectionDetails`: connection/tunnel info layered on top of the resolved attachment, not just an attachment or add-on identity.

None of the three SDK resolvers return this shape. `resolvePgDatabase` resolves the attachment/add-on with the same Postgres-aware fallback rules `getDatabase` uses, but stops there — it doesn't fetch credentials or set up a tunnel, and it isn't callable directly from CLI code even if it did (see [§6c](#6c-resolvepgdatabase)). Until the SDK ships a composite that returns connection/tunnel details, every command currently built on `getDatabase()` has to stay on `utils.pg.DatabaseResolver` for its resolution step even after everything else around it migrates. This is the one part of the old resolver surface the "preserve original resolution method" rule can't satisfy — there's no "same method, new resolver" mapping available, only "keep the old one for now."

---

## Observations

- **Three different code paths resolve "a Postgres database" today** (#1 for generic `addons:*` touching Postgres, #2 for `data:pg:*`, #3 for legacy `pg:*`), each with its own error types and return shapes.
- **`data:pg:*` is not internally consistent**: most of its commands use #2 (`utils.AddonResolver` + manual `isAdvancedDatabase` check), but `wait.ts`, `psql.ts`, and `upgrade/run.ts` use #3 (`DatabaseResolver`) instead, for attachment/tunnel semantics #2 lacks.
- **`pg:links:create.ts`** is the one command that calls two different resolver families in the same method (#1 for the link target, #3 for the primary database).
- **Resolver #4 has no direct callers** — it's fully encapsulated by #3 and could be made private/internal to heroku-cli-util without affecting the CLI.
- **The duplicated tier-check-after-resolve pattern in #2 (repeated ~12 times nearly verbatim) is the clearest consolidation target** — a single Postgres-aware resolve helper in heroku-cli-util that takes an `addonService`/tier requirement and throws consistently, rather than every `data:pg:*` command re-deriving the same `ux.error` after the fact.
- **The `@heroku/sdk` resolvers (§6) are already partially adopted, not purely forward-looking** — `resolveAddon` has direct call sites (`addons/open.ts`, `addons/wait.ts`, `addons/docs.ts`, `data/pg/quotas/*`, `data/pg/attachments/*`) and indirect ones via composites (`addons/info.ts`, `addons/upgrade.ts`); `resolveAddonAttachment` has one direct call site (`addons/open.ts`); `resolvePgDatabase` (internal-only) already backs `pg/backups/*` via composites. Most of the legacy `pg:*` namespace and several `data:pg:*` commands remain on the old resolvers — see [Migration Strategy](#migration-strategy) for the exact per-file breakdown. The one confirmed coverage gap is `DatabaseResolver.getDatabase()` (`ConnectionDetails`/tunnel info): nothing in the SDK replaces it yet, so every `psql`/tunnel-dependent command stays on the old resolver for resolution even after its data calls migrate.
