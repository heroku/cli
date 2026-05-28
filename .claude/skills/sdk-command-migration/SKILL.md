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
- `@heroku/sdk` (current branch tracks GitHub `main`); the bare entry exports `HerokuSDK` and `HerokuSDKOptions`.
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
node -e "console.log(require('@heroku/sdk/package.json').version)"
node -e "const {HerokuSDK} = require('@heroku/sdk'); console.log(typeof HerokuSDK)"
```

Expected: no unmerged paths (`UU`), `HerokuSDK` is `function`. If the working tree is dirty, resolve before proceeding (commit, stash, or restore — depending on what's there). If `HerokuSDK` is `undefined`, the SDK is on the wrong version and the rest of this skill will not apply cleanly.

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

### Step 1.3: Type-check

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v -F -f /tmp/tsc-baseline.txt | tail -20
```

Expected: empty output (no new errors). If new errors appear, they typically fall into:

- **Local-type incompatibility** → first try a single-step cast (`as App[]`). If TS rejects it and demands `as unknown as App[]`, **do not accept the double cast** — see "Realigning local types" below.
- **Helper signature mismatch** → if a helper parameter was typed as `Heroku.X` to mean an array, fix the helper to `App[]` honestly. Anticipate that `lodash` operations like `_.partition` return tuples — destructure: `const [a, b] = _.partition(...)`.
- **Optional-field access** → SDK return types use `team?.name` patterns. If the calling code stored the result in a variable typed `null | string`, coerce with `?? null`.
- **Method-doesn't-exist** → stop and escalate.

#### Realigning local types when a single-step cast is rejected

`as unknown as X` is a smell, not a tool. It means the local `X` and the SDK's return type are *structurally disjoint* — TS can't see any overlap, so it refuses the direct cast. Silencing that with `as unknown as X` doesn't fix the type mismatch; it just hides it from the type checker. Two common root causes, with prescribed fixes:

1. **The local type was invented before the SDK had a usable type.** Older types in `src/lib/types/` (e.g., `App`, `Apps`) were authored as standalone shapes when only `@heroku-cli/schema` was available. Now that `@heroku/types/3.sdk` exposes the canonical types, realign the local type to *extend* the SDK type instead of duplicating it:

   ```ts
   // src/lib/types/app.d.ts — before
   export type App = {
     name: string,
     locked: boolean,
     // ...handwritten fields
   }
   ```

   ```ts
   // src/lib/types/app.d.ts — after
   import type {App as BaseApp, TeamApp} from '@heroku/types/3.sdk'

   export type App = BaseApp & Pick<TeamApp, 'locked' | 'joined'>
   export type Apps = App[]
   ```

   With this shape, `as App[]` succeeds at the call site without `as unknown as`. The `Pick<TeamApp, ...>` pattern is the right tool when the CLI surfaces fields that the SDK only models on a sibling type (e.g., `locked` and `joined` live on `TeamApp`, not `App`, but the CLI's display logic treats them uniformly).

2. **A field is on the upstream type the CLI doesn't realize.** Before adding `Pick<...>`, grep `node_modules/@heroku/types/dist/3.sdk/types.d.ts` for the field — it may already exist on the type the SDK returns. Avoid inventing intersections that duplicate fields the SDK models.

When you realign a local type:
- Stage the change in the source-migration commit (one logical unit: "use the SDK and adopt SDK-aligned types").
- If the realignment exposes a transitive cleanup — e.g., a `_.sortBy(apps, 'name')` that worked under a weakly-typed `App` but feels lazy under the strict shape — replace with `apps.sort((a, b) => a.name.localeCompare(b.name))`. Optional, but prefer it when you can avoid pulling lodash into a hot path.
- A `package-lock.json` bump is allowed if the realignment requires a newer `@heroku/types` (e.g., a missing field was just added upstream). Same rule as Step 1.2's metadata-gap path: include the bump in the source commit and call it out in the body.

The earlier "do NOT modify `src/lib/types/`" rule was overstated — it applies when the local type genuinely diverges from the SDK on purpose (rare). When the local type is just a stale duplicate of the SDK shape, realignment is the correct fix.

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
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v -F -f /tmp/tsc-baseline.txt
```

Expected: empty. New errors mean the migration introduced a regression.

### Step V3: Push and open PR

The PR contains exactly two commits per command:
- `refactor: use @heroku/sdk for <command> command`
- `test(<command>): stub @heroku/sdk directly, drop nock`

Each PR migrates exactly one command. Don't bundle multiple command migrations — review surface stays small and bisect remains useful if a regression slips through.

---

## Self-Review Checklist

Before opening the PR:

- [ ] No `this.heroku.<verb>` calls remain in the migrated file.
- [ ] No bare `heroku.<verb>(...)` calls remain in helper functions (helper-threading shape — see Step 1.2a).
- [ ] No `// TODO(sdk-migration):` markers remain.
- [ ] No `import * as Heroku from '@heroku-cli/schema'` if no longer used.
- [ ] No `import {APIClient} from '@heroku-cli/command'` if no longer used.
- [ ] No `as unknown as X` casts. If TS rejected `as X`, the local type is structurally disjoint from the SDK type — realign the local type per Step 1.3's "Realigning local types" guidance instead of force-casting.
- [ ] No new `tsc` errors (verify against the Pre-flight P2 baseline).
- [ ] Tests rewritten per Task 2: `nock` removed, SDK stubbed via `HerokuSDK.prototype.platform`.
- [ ] Lint clean on changed files.
- [ ] One source file changed per source commit; commit messages follow the convention. A `package-lock.json` bump driven by a route-metadata gap (Step 1.2) is allowed in the source commit and should be called out in the commit body.
- [ ] No incidental edits to other unrelated files (type defs, sibling commands).

---

## Glossary

- **Platform service:** `sdk.platform.*` — methods covering Apps, Spaces, Teams, Account, Pipelines, etc.
- **Data service:** `sdk.data.*` — methods covering Postgres / data-stores. The codemod migrates these alongside platform calls; the SDK supplies the data hostname automatically.
- **Bare entry:** `import {HerokuSDK} from '@heroku/sdk'` — the canonical import. Do not use `@heroku/sdk/sdk` (removed in 0.4) or deep relative imports.
- **Pre-flight baseline:** the snapshot of `tsc`/test state captured before any migration work, used to filter pre-existing noise out of post-migration verification.
- **Codemod:** `scripts/codemods/sdk-migration/migrate-command.ts` — the deterministic transform run in Task 1, Step 1.1.
