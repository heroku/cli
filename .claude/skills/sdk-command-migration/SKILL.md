---
name: sdk-command-migration
description: >
  Migrate a single oclif command in src/commands/ from raw this.heroku.<verb>(path)
  Platform API calls to @heroku/sdk resource methods, then rewrite that command's
  unit tests to stub the SDK directly instead of intercepting HTTP via nock.
  Triggers: migrate <command> to HerokuSDK, convert this command to @heroku/sdk,
  apply SDK migration playbook, /sdk-command-migration.
---

# SDK Command Migration

Apply once per command in `src/commands/`. Each application produces one PR-ready unit of work containing two commits: the source migration and the test rewrite.

## When to Use

**Invoke when:**
- The user asks to migrate a specific command (e.g., "migrate apps:create", "convert apps/info.ts to HerokuSDK").
- The user asks you to apply the SDK migration playbook to a command.
- The user invokes `/sdk-command-migration` directly.

**Do NOT invoke for:**
- Multi-command refactors — each command gets its own application.
- Commands that import from `@heroku/sdk/compositions/*` (the subpath was removed in 0.4 — needs separate migration).
- Helpers/libraries shared by multiple commands — migrate the helper in its own commit and link from the command commits.

## Tech Stack

- TypeScript with NodeNext ESM, `module: "NodeNext"`, target `ES2022`.
- oclif 4 command framework.
- `@heroku/sdk` published beta (currently `^0.1.0-beta`); the bare entry exports `HerokuSDK` and `HerokuSDKOptions`. `@heroku/types` (the route metadata package) is `^3.0.0-beta`.
- `@heroku/heroku-fetch` is a direct dependency exporting `HerokuApiClient`. The SDK uses it internally; commands also use it directly for CLI-only escape hatches (see "CLI-only escape hatches" below).
- **`@heroku-cli/schema` is deprecated.** Replace `import * as Heroku from '@heroku-cli/schema'` with imports from `@heroku/types/3.sdk` (entity types: `App`, `AddOn`, `Collaborator`, `Dyno`, etc.) and from the SDK composite resource files (`AppInfo`, `PipelineCouplingDetail`, etc., from `@heroku/sdk/resources/<service>/<resource>/<file>`). See "Replacing @heroku-cli/schema" below.
- Tests use `mocha` + `chai` + `chai-as-promised` + `sinon`. Existing tests use `nock` to intercept HTTP; the rewrite drops `nock` in favor of direct SDK stubbing.

## Process

```
Pre-flight ── Task 1 (codemod + manual cleanup) ── Task 2 (test rewrite) ── Verify ── Open PR
```

Each step is required. Do not skip.

---

## Pre-flight

Run these once per command, before any code change. They prevent the most common surprises.

### Step P1: Confirm working tree is clean and SDK is on disk

```bash
git status -sb
cat node_modules/@heroku/sdk/package.json | grep -E '"(name|version)"'
node --input-type=module -e "import {HerokuSDK} from '@heroku/sdk'; console.log(typeof HerokuSDK)"
```

Expected: no unmerged paths (`UU`), `HerokuSDK` prints `function`. If the working tree is dirty, resolve before proceeding (commit, stash, or restore — depending on what's there). If `HerokuSDK` prints `undefined`, the SDK is on the wrong version and the rest of this skill will not apply cleanly.

**Why these specific invocations:** the SDK's `exports` map doesn't expose `./package.json` (so `require('@heroku/sdk/package.json')` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`), and the SDK's entry uses top-level `await` (so `require('@heroku/sdk')` fails with `ERR_REQUIRE_ASYNC_MODULE`). Reading `node_modules/@heroku/sdk/package.json` directly and using `--input-type=module` for the import sidesteps both.

### Step P2: Capture baseline of pre-existing failures

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | tee /tmp/tsc-baseline.txt | tail -20
npx mocha 'test/unit/commands/<command-path>.unit.test.ts' --reporter min 2>&1 | tail -5
```

Save the `tsc` baseline. Any errors present here are NOT your responsibility — your goal is "no *new* errors after migration." For the test file, capture pass/fail status; if it was already failing, stop and ask the user before continuing.

### Step P3: Verify the command's call surface

Read the target command file. Confirm:
- The command makes Platform/Data API calls. They may appear in one of two shapes:
  - **Direct**: `this.heroku.<verb>(path, ...)` inside `run()`. The codemod handles these.
  - **Helper-threaded**: `run()` passes `this.heroku` (an `APIClient`) into helper functions that call `heroku.<verb>(path, ...)`. The codemod will produce "no change" (it only matches the `this.heroku.<verb>` shape); follow Step 1.2a for these.
- No call site streams a response, uses raw fetch, or sets custom auth (the codemod flags these but they may indicate this command needs manual migration).

Quick diagnostic for the helper-threading shape:

```bash
grep -nE "(^|[^.])\bheroku\.(get|post|patch|put|delete)\(" src/commands/<command-path>.ts
```

A non-empty result with no `this.` prefix means at least one call site is in a helper that received `heroku` as a parameter — plan for manual migration.

### Step P4: Look for composite resource methods before running the codemod

The codemod walks the route table — it can only suggest 1:1 replacements like `app.info` for `GET /apps/{id}`. It will never suggest a *composite* method that fans out multiple endpoints (e.g., `platform.app.describe` calls `addOn.listByApp` + `app.info` + `dyno.list` + `collaborator.list` + `pipelineCoupling.infoByApp` and soft-fails the optional ones).

If the command does a `Promise.all` over several `this.heroku.get` calls, check whether a composite method already encapsulates that pattern:

```bash
ls node_modules/@heroku/sdk/dist/resources/platform/<resource>/
```

Files other than `index.{js,d.ts}` are composite or extension methods. Read the `.d.ts` to see the input/output shape.

When a composite fits, prefer it over the codemod output: the SDK encapsulates the parallelism and soft-fail logic that today lives inline in the command. The win is a "deep module" interface (one method, one arg) hiding substantial internal complexity. Note the field-name mapping you may need to apply — composites tend to use camelCase return fields, but CLI output contracts are often snake_case (e.g., `pipelineCoupling` from the SDK → `pipeline_coupling` in the command's output).

**Composites are extension methods — register them on the SDK.** `platform.app.describe`, `addOn.create` (with the user-friendly options shape), `pipelineCoupling.infoByApp`, etc. are spliced onto the resource via `extendResource` and only exist when you pass the corresponding extension into the SDK constructor:

```ts
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'

const {platform} = new HerokuSDK({extensions: [appExtensions]})
await platform.app.describe('myapp')   // works
```

Without the `extensions: [...]` argument, `platform.app.describe` is `undefined` at runtime and you get a TypeError. **Test stubs will mask the runtime miss** — `fakePlatform.app.describe = sinon.stub()` is structurally fine even when production wiring is missing, so confirm by reading other commands' wiring (e.g., `src/commands/addons/info.ts`) and run a smoke test against a real app before merging.

**Helper signatures need the extensions threaded through too.** If you extract a helper that takes `platform` as a parameter, the obvious-looking `type Platform = HerokuSDK['platform']` resolves to the *unextended* `PlatformClient` — the class's `Exts` generic falls back to its default empty tuple when you index without supplying it, so `describe` is statically missing on the parameter type even when the runtime call site has the extension. Parameterize the alias instead:

```ts
type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']

async function getInfo(app: string, platform: Platform) {
  const described = await platform.app.describe(app)   // ok
}
```

For helpers that only call route-derived methods (e.g., `app.info`, `app.update`), the bare `HerokuSDK['platform']` alias is fine.

The extension exports are at `@heroku/sdk/extensions/platform` and `@heroku/sdk/extensions/data`. Existing usage:
- `appExtensions` — `describe`, `enableMaintenance`, `disableMaintenance`, `getGeneration`, `getProcessTier`, `isShielded`
- `addOnExtensions` — `create` with the rich options shape used in `addons:create`
- `pipelineCouplingExtensions` — `infoByApp` and related composites used in pipelines commands
- `databaseExtensions` / `postgresDatabaseExtensions` — pg-resource composites
- `logSessionExtensions` — used in `lib/run/log-displayer.ts` for streaming

For commands whose `Promise.all` doesn't match an existing composite, run the codemod normally — the per-call replacements still produce a clean migration.

---

## Task 1: Migrate the command source

Two stages: run the codemod, then resolve any TODO markers it left.

### Step 1.1: Run the codemod (dry-run first)

```bash
npx tsx scripts/codemods/sdk-migration/migrate-command.ts \
  --dry-run src/commands/<command-path>.ts
```

The codemod handles the deterministic 80%:
- Replaces every recognized `this.heroku.<verb>(path)` with `<service>.<resource>.<method>(...)` (`platform` for the Platform API, `data` for Postgres) by reverse-lookup against the SDK route metadata.
- Drops `{body: x}` destructure at call sites (the SDK returns the body directly).
- Unwraps the http-call options shape (`{body: {...}}`) to pass the bare body to SDK methods that take a request body.
- For data routes, silently strips the `{hostname: utils.pg.host()}` options arg — the SDK provides the data hostname automatically.
- Adds `import {HerokuSDK} from '@heroku/sdk'` and inserts `const {<services>} = new HerokuSDK()` at the top of `run()`, destructuring only the services actually used (e.g., `{platform}`, `{data}`, or `{data, platform}`).
- Removes `import * as Heroku from '@heroku-cli/schema'` if no remaining references.

Inspect the diff. If it looks correct, re-run without `--dry-run` to write the file in place:

```bash
npx tsx scripts/codemods/sdk-migration/migrate-command.ts \
  src/commands/<command-path>.ts
```

The codemod exits non-zero if it left any `// TODO(sdk-migration): ...` markers. That's a signal, not a failure.

### Step 1.2: Resolve TODO(sdk-migration) markers

The codemod flags but does not auto-fix the following cases. Address each by hand:

**"no SDK route maps to <verb> <path>"**
The CLI calls an endpoint the SDK does not expose. Stop and escalate — silently re-introducing a raw HTTP call defeats the migration's purpose.

**"ambiguous route resolution for <verb> <path>: A, B, ..."**
Multiple SDK methods share the same `(verb, path)` and disambiguate via request body shape (e.g., `release.create` vs `release.rollback`, both POST `/apps/{id}/releases`). Pick the right one based on the calling code's intent and replace the raw call manually.

**"cannot statically extract path from this.heroku.<verb>(...)"**
The path is a variable rather than a string/template literal. Trace the variable's value, then replace manually.

**"cannot determine SDK request body shape ..."**
The second argument to a write-method call wasn't a recognizable `{body: ...}` wrapper. Inspect the argument and pass the SDK its expected body shape directly.

**"this.heroku.<verb>(...) has an extra argument (request options?) ..."**
The CLI passed http-call options the SDK doesn't accept. For data routes, a lone `{hostname: utils.pg.host()}` is dropped silently and won't appear here — anything that reaches this flag has additional unrecognized properties. If the call is hitting a non-default host (other than the Platform or Data hostname the SDK knows about), escalate. Otherwise, drop the unused options and replace manually.

**Body silently dropped at runtime (route metadata gap)**
The SDK's dispatcher only forwards a request body when the route metadata has `hasRequestBody: true`. If `@heroku/types` is missing that flag for a route, the generated SDK method's TS signature won't accept a body parameter *and* the dispatcher will silently drop any body you cast through. Symptoms: tests fail with "request body did not match" or the migrated PATCH/POST behaves as if it sent an empty payload. Diagnostic:

```bash
npx tsx -e "
import {RouteIndex} from './scripts/codemods/sdk-migration/routes-index.ts';
const r = RouteIndex.load().lookup('PATCH', '/apps/example/config-vars');
console.log('hasRequestBody:', r?.entry.hasRequestBody, 'method:', r?.entry.resource + '.' + r?.entry.method);
"
```

If `hasRequestBody` is `false` but the endpoint logically requires a body, the fix is upstream: the user (or you) needs to bump `@heroku/types` to a version where the route metadata is correct. Stop and ask the user before working around this — escape-hatching to the underlying client defeats the migration's purpose. Once the dependency is updated, re-run `npm install`, re-verify the diagnostic shows `hasRequestBody: true`, and refresh the Pre-flight P2 baseline (the bump may resolve unrelated `tsc` errors too).

**`Warning: name collision with SDK service(s)`** (non-blocking)
A local variable in `run()` shadows the destructured `data` or `platform` service. The codemod still produces the migration, but the inner scope's SDK calls will fail at runtime. Rename the local before merging.

### Step 1.2a: Helper-threaded commands (codemod returned "no change")

The codemod only rewrites `this.heroku.<verb>(...)` call sites. Some commands route API calls through private helpers and pass the `APIClient` as a parameter — the codemod produces "no change" for those because none of the call sites match its pattern. Migrate these by hand:

1. **Convert helpers from `APIClient` to a `Platform` parameter.** At the top of the file (after the imports), declare:
   ```ts
   type Platform = HerokuSDK['platform']
   ```
   Then change each helper signature: replace `heroku: APIClient` with `platform: Platform` (or `data: HerokuSDK['data']` for data-service helpers). Inside the helper, replace each `heroku.<verb>(path, {body: x})` with the corresponding `platform.<resource>.<method>(...)` call — same lookup as Step 1.1 (use `scripts/codemods/sdk-migration/routes-index.ts` to find the resource/method for `(verb, path)`).
2. **Construct the SDK once in `run()`.** Replace the original `this.heroku` thread with:
   ```ts
   const {platform} = new HerokuSDK()
   ```
   then pass `platform` to the helpers.
3. **Drop the `APIClient` import** from `@heroku-cli/command` if it's no longer used; keep `Command` and `flags`.
4. **Drop `{body: app}` destructure at call sites** the same way the codemod does for the simple shape. The SDK returns the body directly — `const app = await platform.app.create(params)`.

For body shapes the codemod would have unwrapped, do the unwrap by hand. The pattern `await heroku.post<Heroku.App>('/apps', {body: params})` becomes `await platform.app.create(params)`. Cast to the `*CreateOpts` type from `@heroku/types/3.sdk` if the local body shape isn't structurally assignable.

Both shapes (direct and helper-threaded) can coexist in the same command. If the codemod migrated some call sites and "no change"d others, finish the remaining ones manually using this step before moving on.

### Step 1.2c: Replace `@heroku-cli/schema` imports

`@heroku-cli/schema` is deprecated. Every reference to `Heroku.<Type>` in the migrated file needs to be replaced with the canonical type. There are three sources to choose from, in priority order:

1. **Entity types — `@heroku/types/3.sdk`.** The base wire-format types: `App`, `AddOn`, `Collaborator`, `Dyno`, `PipelineCoupling`, `TeamApp`, `Release`, etc. Use these wherever the original code used `Heroku.App`, `Heroku.AddOn`, etc., for individual platform entities.

   ```ts
   import {AddOn, App, Collaborator, Dyno} from '@heroku/types/3.sdk'
   ```

   Use the value-form `import` (no `type` modifier) to avoid the `n/no-extraneous-import` lint quirk on transitive deps.

2. **Composite return types — `@heroku/sdk/resources/<service>/<resource>/<file>`.** When the migrated code uses a composite SDK method (`platform.app.describe`, etc., from Step P4), the composite's return type is exported from the resource file alongside the function:

   ```ts
   import type {AppInfo, PipelineCouplingDetail} from '@heroku/sdk/resources/platform/app/info'
   ```

   The SDK's `package.json` exports map uses `./resources/*` with a wildcard; the path must be specific enough to disambiguate the file (e.g., `app/info`, not `app` — the latter resolves to a sibling file at the parent level).

3. **Extension types — `src/lib/types/`, with local declarations only as a stepping stone.** Strict types from `@heroku/types/3.sdk` are *narrower* than the loose `@heroku-cli/schema` types they replace. They will surface fields the CLI reads but `@heroku/types` doesn't declare (e.g., `cron_finished_at`, `cron_next_run`, `database_size`, `create_status`, `extended` on `App` — all platform-returned but absent from the strict schema). Don't paper over with `as any`.

   Check `src/lib/types/<resource>.d.ts` first — the gaps that have already surfaced in earlier migrations are exported there. For `App`, the existing extension is `ExtendedApp` in `src/lib/types/app.d.ts`:

   ```ts
   import {ExtendedApp} from '../../lib/types/app.js'
   ```

   If the gap you're hitting isn't already exported, add the extension type next to the existing `App`/`Apps` exports rather than declaring it locally in the command. Use a name that describes the *use case* (`ExtendedApp` = the `App` shape under `--extended`), not the file it lives in (avoid `LocalApp`, `MyApp`). A local declaration in the command file is fine as a transient stepping stone, but promote it to `src/lib/types/` the moment a second command needs the same fields.

   When the same gap accumulates across many commands, propose an upstream `@heroku/types` bump and remove the extension once the strict schema catches up.

**Derive composite-shaped helper types from the SDK; don't restate them.** When a command uses a composite return type (`AppInfo`, etc.) and needs to widen one field — e.g., the `app` field is the `ExtendedApp` shape under `--extended` — derive structurally instead of restating the whole type:

```ts
// Good — one field overridden, the rest stays in sync with the SDK.
type Info = Omit<AppInfo, 'app'> & {app: ExtendedApp}

async function getInfo(...): Promise<Info> {
  return platform.app.describe(app)   // structural assignment, no field copy
}

// Bad — restates the SDK shape and copies fields one-by-one. New SDK fields
// silently drop on the floor; an upstream rename type-checks but breaks at runtime.
type Info = {
  addons: AddOn[]
  app: ExtendedApp
  collaborators: Collaborator[]
  dynos: Dyno[]
  pipeline_coupling: null | PipelineCouplingDetail
}

async function getInfo(...): Promise<Info> {
  const described = await platform.app.describe(app)
  return {
    addons: described.addons,
    app: described.app,
    collaborators: described.collaborators,
    dynos: described.dynos,
    pipeline_coupling: described.pipelineCoupling,
  }
}
```

The pathology of restating: `pipeline_coupling: described.pipelineCoupling` still type-checks if the SDK renames `pipelineCoupling` upstream — the bug surfaces only at runtime as `undefined`.

**Localize CLI/SDK contract translations to the output boundary.** The CLI's JSON/shell output contract is snake_case; SDK return shapes are camelCase. Don't thread renamed fields through the entire helper pipeline — keep the SDK shape internal and rename only at the output sites that are the CLI contract:

```ts
// Good — rename happens at the JSON serialization boundary.
} else if (flags.json) {
  const {pipelineCoupling, ...rest} = info
  hux.styledJSON({...rest, pipeline_coupling: pipelineCoupling})
}

// Bad — pipeline_coupling threaded through every read site upstream.
if (info.pipeline_coupling) print('pipeline', `${info.pipeline_coupling.pipeline.name}:...`)
```

The CLI is the bounded context owning snake_case output; the SDK is a different bounded context using camelCase. Translation belongs at the seam, not inside either domain. This pattern recurs on every command whose JSON output uses snake_case — which is most of them.

**Strict-null findings need careful handling.** Where `@heroku-cli/schema` had `web_url: string`, `@heroku/types/3.sdk` has `web_url: string | null` (correct per the OpenAPI spec). The migrated code may pass these through to functions expecting non-null arguments — e.g., `filesize(repo_size, ...)` or `print('web_url', web_url)`. **Don't silently coalesce nulls (`?? ''`, `?? 0`)**: that changes observable output (`web_url=null` becomes `web_url=`). Prefer one of:

- **`as` cast at the call site** when the runtime path is gated upstream (truthiness check) but TS can't prove it: `filesize(info.app.repo_size as number, ...)`.
- **Loosen the consumer's signature** if the consumer is local and just stringifies: `function print(k: string, v: unknown)` instead of `(k: string, v: string)`. This preserves the original behavior of printing `null` / `undefined` literally if they slipped through.

Don't just gate with truthiness if the original code didn't — that's a behavior change disguised as a type fix.

### Step 1.2b: CLI-only escape hatches via `HerokuApiClient`

Some endpoints exist on the platform but aren't exposed by the SDK because they're CLI-only concerns — the canonical example is `GET /apps/{id}?extended=true`, which the route table collapses to plain `app.info` (the query string is lost in lookup). When the user confirms the variant should stay a CLI concern, drop to `HerokuApiClient` directly rather than keeping a `this.heroku.<verb>` thread:

```ts
import {HerokuApiClient} from '@heroku/heroku-fetch'

const client = new HerokuApiClient()
const response = await client.get(`/apps/${app}?extended=true`)
const appExtended = await response.json() as ExtendedApp
```

Why this is preferable to keeping `this.heroku.<verb>`:
- It removes the `APIClient` thread from the command (no need to keep `client: Command` parameters around just for one call).
- It stubs at one well-defined prototype boundary in tests (`HerokuApiClient.prototype.get`), parallel to the SDK stubbing pattern.
- It's the same client the SDK uses internally, so there's no behavioral divergence.

The return value is a `Response`-shaped object — call `.json()` to get the body. Don't construct real `Response` objects in tests; duck-type the stub return as `{json: async () => fixture}` (avoids `n/no-unsupported-features/node-builtins` warnings and only stubs what the command actually uses).

Confirm with the user before reaching for this — it's a deliberate escape hatch, not a default. Document it in the source commit body.

### Step 1.3: Type-check

```bash
if [ -s /tmp/tsc-baseline.txt ]; then
  npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v -F -f /tmp/tsc-baseline.txt | tail -20
else
  npx tsc --noEmit -p tsconfig.json 2>&1 | tail -20
fi
```

The `[ -s … ]` guard matters: when the baseline is empty (clean repo), `grep -v -F -f /tmp/tsc-baseline.txt` matches *nothing* because the empty pattern file has no patterns to match against — a false "no errors" signal in exactly the case where strict checking matters most.

Expected: empty output (no new errors). If new errors appear, they typically fall into:

- **Local-type incompatibility** → use a single-step cast (`as App[]`, not `as unknown as App[]`) at the call site. Reach for `as unknown as X` only if the single-step is rejected.
- **Helper signature mismatch** → if a helper parameter was typed as `Heroku.X` to mean an array, fix the helper to `App[]` honestly. Anticipate that `lodash` operations like `_.partition` return tuples — destructure: `const [a, b] = _.partition(...)`.
- **Optional-field access** → SDK return types use `team?.name` patterns. If the calling code stored the result in a variable typed `null | string`, coerce with `?? null`.
- **Method-doesn't-exist** → stop and escalate.

Do NOT modify type files in `src/lib/types/` to satisfy a cast in a command file. Those types exist for a reason; the cast is the right tool here.

### Step 1.4: Run the existing tests

```bash
npx mocha 'test/unit/commands/<command-path>.unit.test.ts' --reporter min 2>&1 | tail -5
```

The existing nock-based tests will likely fail at this stage with "Mocks not yet satisfied" or similar — the SDK uses `@heroku/heroku-fetch` (built on `undici`) which `nock` does not intercept on Node 20+. **Do not try to make these tests pass in Task 1.** Note the failure mode and move on to Task 2; the test rewrite is the fix.

The exception: if a test fails for a *different* reason (e.g., a TypeError thrown inside the migrated code), that's a real regression. Diagnose and fix before continuing. Useful filter: failures whose stack traces point into `src/commands/...` are real; failures whose only assertion is "Mocks not yet satisfied" or "expected … to include …" with empty output are nock-no-longer-intercepts noise.

### Step 1.5: Lint and commit Task 1

```bash
npx eslint src/commands/<command-path>.ts
git add src/commands/<command-path>.ts
git commit -m "refactor: use @heroku/sdk for <command> command"
```

Lint warnings that pre-existed are acceptable. Do NOT introduce new violations; if eslint flags something, fix it (or re-run with `--fix` for stylistic-only issues, then verify the autofix didn't change semantics).

Common lint surprises on migrated files:
- `n/no-extraneous-import` flags `import type {...} from '@heroku/types/3.sdk'`. The package is a transitive dependency, but the rule only complains about the type-only form. Drop the `type` modifier — `import {AppCreateOpts, ...} from '@heroku/types/3.sdk'` lints clean. Match the value-form pattern used in `src/commands/pipelines/create.ts`.
- `@stylistic/operator-linebreak`, `@stylistic/object-curly-newline` — stylistic and autofixable. Run `npx eslint --fix` once, then re-lint to confirm no new errors.

If the source migration required a `package.json`/`package-lock.json` bump (typically because of a route-metadata gap caught in Step 1.2), include the lockfile in this commit and explain the bump in the commit body. Don't split the lockfile change into its own commit — it's load-bearing for the source migration in the same PR.

---

## Task 2: Rewrite tests to stub the SDK

This task is required, not optional. `nock` keeps intercepting after Task 1 because `@heroku/sdk` issues the same HTTP calls under the hood — but that means the existing tests are still asserting on URL shape rather than the SDK contract the migrated code now depends on. Leaving nock in place would let a future SDK change (different endpoint, batched call, retry policy) break production while tests stay green.

The reference implementation is at `test/unit/commands/apps/index.unit.test.ts`.

### Step 2.1: Build a `FakePlatform` shape

List only the resources used by the migrated command:

```ts
import {HerokuSDK} from '@heroku/sdk'
import * as sinon from 'sinon'

type FakePlatform = {
  app: {info: sinon.SinonStub; delete: sinon.SinonStub}
  // ...add only the resources/methods this command actually calls
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: sinon.stub(), delete: sinon.stub()},
  }
}
```

### Step 2.2: Stub the `platform` getter on `HerokuSDK.prototype`

```ts
let fakePlatform: FakePlatform

beforeEach(function () {
  fakePlatform = buildFakePlatform()
  sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
})

afterEach(function () {
  sinon.restore()
})
```

This works because `HerokuSDK.platform` is a class-prototype getter (configurable by default in ES). `sinon.stub(...).get(...)` swaps it for the duration of the test; `sinon.restore()` restores it.

If you encounter `TypeError: Descriptor for property platform is non-configurable and non-writable`, escalate — the SDK's class shape changed and this skill needs updating.

### Step 2.2b: Stub `HerokuApiClient.prototype.get` if the command uses the escape hatch

When the source command uses `HerokuApiClient` directly (Step 1.2b), add a parallel prototype stub:

```ts
import {HerokuApiClient} from '@heroku/heroku-fetch'

let apiGet: sinon.SinonStub

beforeEach(function () {
  // ...platform stub from 2.2...
  apiGet = sinon.stub(HerokuApiClient.prototype, 'get')
})

// Per test:
apiGet.withArgs('/apps/myapp?extended=true').resolves({json: async () => appExtendedFixture})
```

Use a duck-typed `{json: async () => fixture}` return rather than constructing a real `Response`. The `Response` global is flagged as experimental on Node 20 by `n/no-unsupported-features/node-builtins`; the duck-type also captures the SDK contract more precisely (the migrated code only calls `.json()`, nothing else).

### Step 2.3: Wire individual stubs per test, drop `nock` interceptors

```ts
it('does the thing', async function () {
  fakePlatform.app.info.resolves({name: 'example', /* ... */})

  const {stdout} = await runCommand(Cmd, ['--app', 'example'])

  expect(stdout).to.equal('expected output\n')
  expect(fakePlatform.app.info.calledOnceWithExactly('example')).to.equal(true)
})
```

Add `.calledOnceWithExactly(...)` assertions on tests where the flag-to-method routing is the unit under test. Skip them on tests that are about output formatting only — they add noise.

### Step 2.4: Use non-mutating spreads for fixture variants

If the old test used `Object.assign(baseFixture, {region: {name: 'eu'}})`, replace with `{...baseFixture, region: {name: 'eu'}}`. Shared mutable fixtures are a latent test-pollution bug; the rewrite is a chance to fix it.

### Step 2.5: Run, lint, commit Task 2

```bash
npx mocha 'test/unit/commands/<command-path>.unit.test.ts' --reporter min 2>&1 | tail -5
npx eslint test/unit/commands/<command-path>.unit.test.ts
git add test/unit/commands/<command-path>.unit.test.ts
git commit -m "test(<command>): stub @heroku/sdk directly, drop nock"
```

Expected: same test count, all passing.

---

## Verify and finish

### Step V1: Targeted test run

```bash
npx mocha 'test/unit/commands/<dir>/**/*.unit.test.ts' --reporter min 2>&1 | tail -5
```

Use the parent directory of the migrated command. Expected: all passing. If a sibling command's tests broke, your change leaked outside the migrated file — investigate before continuing.

### Step V2: Type-check delta

```bash
if [ -s /tmp/tsc-baseline.txt ]; then
  npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v -F -f /tmp/tsc-baseline.txt
else
  npx tsc --noEmit -p tsconfig.json 2>&1
fi
```

Expected: empty. New errors mean the migration introduced a regression. (Same baseline-empty caveat as Step 1.3.)

### Step V3: Push and open PR

**Base branch is `feat/heroku-sdk-integration`, not `main`.** All SDK-migration work stacks onto the integration branch until that branch lands. Opening against `main` would surface ~120 files of integration-branch noise to reviewers; opening against `feat/heroku-sdk-integration` shows only the per-command diff (~4 files). When the integration branch eventually merges, GitHub automatically updates the open child PRs to target `main` with the same minimal diff.

```bash
git push -u origin <branch>
gh pr create --draft --base feat/heroku-sdk-integration \
  --title "refactor: use @heroku/sdk for <command> command" \
  --body "$(cat <<'EOF'
## Summary
...
## Test plan
- [x] tsc clean vs. baseline
- [x] eslint clean
- [x] mocha for the migrated test file passes
- [x] mocha for sibling tests in the same dir passes
- [ ] Manual smoke test against a real app (list the flag combinations to exercise)
EOF
)"
```

The PR contains exactly two commits per command:
- `refactor: use @heroku/sdk for <command> command`
- `test(<command>): stub @heroku/sdk directly, drop nock`

If the source migration uses the `HerokuApiClient` escape hatch (Step 1.2b), append `and @heroku/heroku-fetch` to the test commit subject: `test(<command>): stub @heroku/sdk and @heroku/heroku-fetch directly, drop nock`.

Each PR migrates exactly one command. Don't bundle multiple command migrations — review surface stays small and bisect remains useful if a regression slips through.

---

## Self-Review Checklist

Before opening the PR:

- [ ] No `this.heroku.<verb>` calls remain in the migrated file. (Escape-hatch calls go through `HerokuApiClient` per Step 1.2b — never via `this.heroku`.)
- [ ] No bare `heroku.<verb>(...)` calls remain in helper functions (helper-threading shape — see Step 1.2a).
- [ ] No `// TODO(sdk-migration):` markers remain.
- [ ] Composite resource methods checked (Step P4) before falling back to per-call replacements when the command had a `Promise.all` over multiple endpoints.
- [ ] If a composite method is used (e.g., `platform.app.describe`), the corresponding extension (`appExtensions`, `addOnExtensions`, etc.) is imported from `@heroku/sdk/extensions/<service>` and passed to the `HerokuSDK` constructor via `{extensions: [...]}`. Without this, the method is `undefined` at runtime — but stub-based tests will pass anyway. Verify by reading a sibling command's wiring or smoke-testing against a real app.
- [ ] No `import * as Heroku from '@heroku-cli/schema'` (deprecated). Entity types come from `@heroku/types/3.sdk`; composite return types from `@heroku/sdk/resources/<service>/<resource>/<file>`; CLI-only field gaps captured by extension types in `src/lib/types/` (Step 1.2c).
- [ ] Helper return types derived from the SDK composite (`Omit<AppInfo, 'app'> & {app: ExtendedApp}`) rather than restated structurally; helpers spread/return the SDK result instead of copying fields one-by-one.
- [ ] CLI/SDK contract renames (e.g., `pipelineCoupling` → `pipeline_coupling`) happen at output boundaries (JSON/shell), not threaded through internal helpers.
- [ ] Strict-null findings handled without changing observable output: `as` cast or loosened consumer signature, never `?? ''` / `?? 0` for fields the original printed verbatim.
- [ ] No `import {APIClient} from '@heroku-cli/command'` if no longer used.
- [ ] No `as unknown as X` cast where `as X` would suffice.
- [ ] No new `tsc` errors (verify against the Pre-flight P2 baseline).
- [ ] Tests rewritten per Task 2: `nock` removed, SDK stubbed via `HerokuSDK.prototype.platform`. If escape hatch in use: `HerokuApiClient.prototype.get` also stubbed (Step 2.2b).
- [ ] Test stubs for the escape hatch return duck-typed `{json: async () => fixture}` — no `new Response(...)`.
- [ ] Lint clean on changed files.
- [ ] One source file changed per source commit; commit messages follow the convention. A `package.json`/`package-lock.json` bump (route-metadata gap from Step 1.2, or a new direct dep like `@heroku/heroku-fetch` for the escape hatch from Step 1.2b) is allowed in the source commit and should be called out in the commit body.
- [ ] No incidental edits to other unrelated files (type defs, sibling commands).
- [ ] PR opened with `--base feat/heroku-sdk-integration`, not `main` (Step V3).

---

## Glossary

- **Platform service:** `sdk.platform.*` — methods covering Apps, Spaces, Teams, Account, Pipelines, etc.
- **Data service:** `sdk.data.*` — methods covering Postgres / data-stores. The codemod migrates these alongside platform calls; the SDK supplies the data hostname automatically.
- **Bare entry:** `import {HerokuSDK} from '@heroku/sdk'` — the canonical import. Do not use `@heroku/sdk/sdk` (removed in 0.4) or deep relative imports.
- **Composite method:** a resource method that fans out multiple underlying calls and soft-fails optional ones (e.g., `platform.app.describe`). Lives in `node_modules/@heroku/sdk/dist/resources/<service>/<resource>/` as a separate file from `index.{js,d.ts}`. Not in the codemod's route table — discovered manually per Step P4.
- **Entity types vs. composite return types:** entity types (`App`, `AddOn`, etc.) come from `@heroku/types/3.sdk` and describe the wire format. Composite return types (`AppInfo`, `PipelineCouplingDetail`, etc.) come from the SDK resource file that owns the composite (e.g., `@heroku/sdk/resources/platform/app/info`).
- **Escape hatch:** a direct `HerokuApiClient` call from `@heroku/heroku-fetch` for endpoints/variants the SDK doesn't expose. Sanctioned for CLI-only concerns like `?extended=true` query variants — see Step 1.2b.
- **Pre-flight baseline:** the snapshot of `tsc`/test state captured before any migration work, used to filter pre-existing noise out of post-migration verification.
- **Codemod:** `scripts/codemods/sdk-migration/migrate-command.ts` — the deterministic transform run in Task 1, Step 1.1.
- **Integration branch:** `feat/heroku-sdk-integration` — the base branch for all per-command migration PRs until the integration lands. See Step V3.
