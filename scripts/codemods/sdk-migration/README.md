# SDK Migration Codemod

Mechanically migrates a single oclif command file from raw `this.heroku.<verb>(path)` calls to `@heroku/sdk` resource methods (`sdk.platform.*` for the Platform API and `sdk.data.*` for the Postgres data API). Used as Task 1 of the SDK command migration playbook.

## Usage

```bash
# Preview changes
npx tsx scripts/codemods/sdk-migration/migrate-command.ts \
  --dry-run src/commands/apps/info.ts

# Apply in-place
npx tsx scripts/codemods/sdk-migration/migrate-command.ts \
  src/commands/apps/info.ts
```

Run on **one file at a time** for clean review. Passing multiple paths is supported but each file is migrated independently.

## What it does

For each `this.heroku.<verb>(...)` call:

1. Looks up the `(verb, path)` pair against both `@heroku/types/3.sdk/routes` (Platform) and `@heroku/types/data/routes` (Data) to find the matching SDK resource, method, and service namespace.
2. Replaces the call with `<service>.<resource>.<method>(...)` (e.g., `platform.app.info(id)` or `data.database.info(name)`), mapping path placeholders to positional arguments in declaration order.
3. Drops the surrounding `{body: x}` destructure (the SDK returns the body directly).
4. Unwraps the http-call options object (`{body: data}` → `data`) when passing a request body to a write method.
5. For data routes, silently drops the `{hostname: utils.pg.host()}` options arg — the SDK provides the data hostname automatically.
6. Adds `import {HerokuSDK} from '@heroku/sdk'` and inserts `const {<services>} = new HerokuSDK()` at the top of `run()` if missing, destructuring only the services actually used.
7. Removes `import * as Heroku from '@heroku-cli/schema'` if no remaining references.

## What it flags (does not auto-fix)

The codemod inserts a `// TODO(sdk-migration): <reason>` comment above call sites it cannot safely transform, and exits non-zero. Reasons include:

- The path argument is not a string literal or template literal (e.g., a variable computed elsewhere).
- No SDK route maps to the `(verb, path)` pair.
- Multiple SDK routes match the same `(verb, path)` and disambiguate via request body shape (e.g., `release.create` vs `release.rollback`).
- The call passes a second argument (request options) the SDK method does not accept. (For data routes, a single `{hostname}` option is dropped silently; anything else is flagged.)
- The number of template placeholders does not match the SDK route's path placeholders.

For these, the original call is left in place. Resolve manually before continuing the migration.

The codemod also emits a non-blocking **warning** when a local variable in `run()` would shadow an SDK service name (e.g., a local `const data = ...` colliding with the destructured `data` service). Rename the local before merging.

## What it does NOT do

Out of scope by design — these belong to the agent executing the playbook:

- **Type cast adjustments.** Expressions like `as App[]` or `as unknown as App[]` at call sites.
- **Helper signature tightening.** When a helper parameter was typed as `Heroku.X` to mean "an array of X", honest retyping plus call-site fixes (destructuring tuples from `_.partition`, etc.) is manual.
- **Test rewrites.** The companion task in the playbook stubs the SDK directly via `sinon.stub(HerokuSDK.prototype, 'platform').get(...)`. The codemod only touches `src/commands/`.
- **Compositions.** Files importing from `@heroku/sdk/compositions/*` were broken by the 0.4 SDK release and need a separate migration.

## How the route index is built

At startup, the codemod imports `@heroku/types/3.sdk/routes` and `@heroku/types/data/routes` (generated metadata files shipped with the SDK types) and indexes every route by `(httpVerb, pathRegex)`, tagged with its service (`platform` or `data`). A concrete path like `/apps/foo/dynos` matches against the regex form of `/apps/{appIdentity}/dynos`; `/client/v11/databases/foo` matches against `/client/v11/databases/{name}`. The matching route's `resource`, `method`, and `service` come directly from the SDK metadata.

When two routes match the same concrete `(verb, path)` (e.g., `release.create` and `release.rollback`, both POST `/apps/{id}/releases`), the codemod flags the call site rather than guessing. Path prefixes for the two services do not overlap, so cross-service ambiguity is impossible by construction.

## Extending

If a needed route has no SDK mapping, the right fix is in the SDK package, not here. The codemod is intentionally a pass-through over `@heroku/types/{3.sdk,data}/routes` — adding hand-curated mappings would create drift.

If a calling pattern in the CLI doesn't match the codemod's recognizers (e.g., `this.heroku.get(...)` aliased through a helper), update `transform.ts` to recognize the new shape rather than working around it in the source.
