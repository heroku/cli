# SDK Command Migration Process

This is the manual guide to migrating a command to `@heroku/sdk`. It covers the whole process end to end, so you can run a migration entirely by hand. Its focus is the parts that need a human, the decisions the [codemod](../../../scripts/codemods/sdk-migration) can't make and the places where the automation hands the problem back to you.

Most of the migration is mechanical. An agent running the [`SKILL.md`](./SKILL.md) playbook can do the routine steps, and the [codemod](../../../scripts/codemods/sdk-migration) rewrites the raw `this.heroku.<verb>(path)` calls. Neither can choose the right SDK method, decide where business logic belongs, work out what `run()` should return, or judge whether the output still matches what users expect. Each section below marks where you have to step in.

You'll return to two spots most: [Where you need to step in](#where-you-need-to-step-in) and [run() return value](#5-run-return-value). Those are the parts the automation can't finish for you.

If you just want the exact commands and the commit/PR mechanics, [`SKILL.md`](./SKILL.md) is the executable version of this same process. The two are meant to agree.

---

## 1. Guidelines

These rules keep each migration reviewable and easy to unwind if something slips through. [`SKILL.md`](./SKILL.md) is written to follow them.

- One command per PR. Don't bundle multiple command migrations. One command at a time keeps the review small and keeps a later bisect useful when a regression turns up.
- Two commits per command, the source migration first and then the test rewrite. Commit messages:
  - `refactor: use @heroku/sdk for <command> command`
  - `test(<command>): stub @heroku/sdk directly, drop nock`
- Open PRs against `v12.0.0`, not `main`. This work is part of the v12 release, so nothing merges to `main` yet.

---

## 2. The codemod

### What the codemod handles

The [codemod](../../../scripts/codemods/sdk-migration) does the repetitive work so you can spend your attention on the decisions that need judgment. Dry-run first, read the diff, then write:

```bash
npx tsx scripts/codemods/sdk-migration/migrate-command.ts --dry-run src/commands/<path>.ts
npx tsx scripts/codemods/sdk-migration/migrate-command.ts         src/commands/<path>.ts
```

It handles the deterministic ~80%:
- reverse-looks-up each `this.heroku.<verb>(path)` against the SDK route table and replaces it with `<service>.<resource>.<method>(...)`,
- unwraps `{body: ...}` at call sites (the SDK returns the body directly),
- drops the `{hostname}` option, adds `import {HerokuSDK} from '@heroku/sdk'`, and inserts a single `const {<services>} = new HerokuSDK()` at the top of `run()`,
- removes the deprecated `@heroku-cli/schema` import when nothing else references it.

When it leaves a `// TODO(sdk-migration): ...` marker it exits non-zero. Read that as a pointer to a spot that needs your judgment, not as a failure.

The rest of the toolkit lives alongside it in `scripts/codemods/sdk-migration/`: `preflight.sh` (working-tree, SDK, and baseline checks), `tsc-delta.sh` (new-error filter against the baseline), `check-route.sh` (route-metadata diagnostics), `routes-index.ts` (the `(verb, path)` -> resource/method lookup), `transform.ts` (the AST engine), and `README.md`.

### Where you need to step in

These are the cases the codemod flags but leaves for you. Each one needs a decision it can't make. This is the section you'll come back to most.

#### Helper-threaded APIClient calls

Some commands pass `this.heroku` into private helpers that call `heroku.<verb>(path)`. The codemod reports "no change" for those, because it only matches the `this.heroku.<verb>` shape. To finish them by hand, change each helper's `heroku: APIClient` parameter to `platform: Platform` (or `data: HerokuSDK['data']`), rewrite the calls, construct the SDK once in `run()`, and pass `platform` in. For the reasoning, see [Business-logic placement](#4-business-logic-placement) and [Test pattern for SDK stubbing](#6-test-pattern-for-sdk-stubbing).

#### Metadata-gap workarounds

The SDK's dispatcher only forwards a request body when the route metadata has `hasRequestBody: true`. When `@heroku/types` is missing that flag, the generated method won't accept a body, and it silently drops anything you cast through, so you'll see "request body did not match" or an empty payload. Confirm it with `bash scripts/codemods/sdk-migration/check-route.sh PATCH /apps/example/config-vars`. The fix belongs upstream, in a `@heroku/types` bump. An escape hatch around it quietly undoes what the migration is for, so take the slower path. Include the lockfile bump in the source commit and explain it in the body.

#### Multi-instance HerokuSDK refactors

Aim for one `new HerokuSDK()` per `run()`, threaded into helpers as a parameter. It keeps the command's test setup clean and the "one SDK, threaded through" model intact. [Test pattern for SDK stubbing](#6-test-pattern-for-sdk-stubbing) covers what extra instances cost you.

#### Return-value backfill on already-migrated commands

A few commands migrated on this branch still return void. When you're in one of them, take the chance to bring it up to the return-value contract. See [run() return value](#5-run-return-value).

#### Ambiguous routes, dynamic paths, and schema types

When several methods share a `(verb, path)`, pick the one that matches the request-body intent. When the path is a variable, trace it and replace it by hand. Swap every `Heroku.<Type>` for its canonical replacement: entity types from `@heroku/types/3.sdk` (`App`, `AddOn`, `Collaborator`, `Dyno`, ...), composite return types from `@heroku/sdk/resources/<service>/<resource>/<file>` (`AppInfo`, ...), and CLI-only field gaps from `src/lib/types/` (for example `ExtendedApp` in `src/lib/types/app.d.ts`).

---

## 3. SDK method selection

After the codemod's pass, the first real decision is which SDK method to use.

Reach for a composite method before hand-rolling a `Promise.all`. When a command fans out to several endpoints, there's often a composite that already wraps up the parallelism and soft-fail logic: `platform.app.describe` (fans out addons, app, dynos, collaborators, and pipeline coupling), `addOn.create` (the rich user-facing options shape), or `pipelineCoupling.infoByApp`. Composites live as separate files under `node_modules/@heroku/sdk/dist/resources/<service>/<resource>/` (anything other than `index.{js,d.ts}`), so look there before you build the fan-out yourself.

Composites are extension methods, so register them. They only exist at runtime when you pass the matching extension to the constructor:

```ts
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'

const {platform} = new HerokuSDK({extensions: [appExtensions]})
await platform.app.describe('myapp')   // undefined at runtime without the extension
```

The catch worth watching for: test stubs mask a missing registration, because a stubbed `describe` looks structurally fine even when the production wiring isn't there. Check the registration against a sibling command's wiring and smoke-test against a real app before you trust it. For helpers, parameterize the type alias so the extended method shows up statically: `type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']`.

When there's no composite, take the codemod's 1:1 route-derived method. This is the most common case, and it's a good result.

When adding to the SDK, follow the namespace convention. Data-plane services live under `data.*` (for example `data.database.*`, `data.redis.*`, `data.pgBackup.*`, `data.maintenance.*`), and platform-plane services live under `platform.*`. When you're not sure where something belongs, check `src/services/` (in the [heroku/heroku-sdk repo](https://github.com/heroku/heroku-sdk)) and `src/resources/` for the current namespace layout.

---

## 4. Business-logic placement

As you migrate, logic tends to move around. Think in three tiers and ask which one each piece belongs to.

- The SDK handles cross-endpoint orchestration, retries, soft-fail, and hostname resolution. If a command is fanning out several calls with its own error handling, the work wants to live in a composite method rather than the command. Push it down instead of reimplementing it in the CLI.
- A shared CLI helper (`src/lib/...`) is for logic reused across commands. A helper takes `platform`/`data` as a parameter and leaves the SDK construction to its caller; [Test pattern for SDK stubbing](#6-test-pattern-for-sdk-stubbing) explains why that matters for tests. Type its parameter `type Platform = HerokuSDK['platform']`, or the extension-parameterized form when it calls a composite.
- The command class `run()` owns flag parsing, the single `new HerokuSDK()`, and output rendering via `hux`/`ux`. It's also where the two naming worlds meet. The CLI's snake_case output is a contract the CLI owns, and the SDK's camelCase return shapes are a separate bounded context. Translate between them right at the output boundary (the JSON/shell serialization sites) rather than threading renamed fields back through the helpers:

  ```ts
  // Good: rename at the JSON serialization boundary.
  } else if (flags.json) {
    const {pipelineCoupling, ...rest} = info
    hux.styledJSON({...rest, pipeline_coupling: pipelineCoupling})
  }
  ```

In the same spirit, derive composite-shaped helper types from the SDK instead of restating them by hand. `type Info = Omit<AppInfo, 'app'> & {app: ExtendedApp}` keeps your type in sync with the SDK and sidesteps a subtle trap: a restated `pipeline_coupling: described.pipelineCoupling` still type-checks after an upstream rename, then quietly returns `undefined` at runtime.

---

## 5. run() return value

The contract is that `run()` should return the SDK-shaped data it fetched or produced. When it does, the command becomes composable, so other commands and tests can call it and assert on its behavior without scraping stdout. Prefer returning the SDK result (or a small object built from it) over `void`.

These commands on this branch still return void and need updating to match the contract (there are work items tracking the work):
- `src/commands/addons/detach.ts` (`Promise<void>`, line 17). A natural return is `{attachment, releases}`; both are already fetched and today only used for their side effects.
- `src/commands/pipelines/info.ts` (implicit void, line 32). A natural return is `{pipeline, apps}`.
- `src/commands/apps/create.ts` (void). A natural return is the created app.

Some commands genuinely can't produce a payload, and that's fine. Don't force one:
- Streaming commands like `logs --tail` return void or a short summary. Under `--tail` the stream never ends, so there's nothing serializable to hand back.
- Interactive TTY commands like `run:inside` and `redis:cli` call `process.exit()` / `ux.exit()`, which oclif catches as `EEXIT`. Control never returns normally, so there's no value to produce.
- Progressive-stdout commands, such as a backup download that prints progress as it goes, return a summary of the finished operation rather than the streaming progress itself.

---

## 6. Test pattern for SDK stubbing

Once the source is migrated, the tests change too. We drop `nock` here, since it no longer intercepts the SDK's `undici`-based fetch on Node 20+, and stub the SDK directly instead. For a full example to read alongside this, `test/unit/commands/apps/info.unit.test.ts` and `test/unit/commands/apps/index.unit.test.ts` are the reference implementations.

Build a `FakePlatform` with just the resources and methods the command actually uses:

```ts
type FakePlatform = {
  app: {describe: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {app: {describe: sinon.stub()}}
}
```

Stub the prototype getter in `beforeEach` and restore it in `afterEach`:

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

This works because `HerokuSDK.platform` is a configurable class-prototype getter, so `sinon.stub(...).get(...)` can swap it out for the duration of the test. If your command uses the `HerokuApiClient` escape hatch (see [Backwards-compatibility rules](#7-backwards-compatibility-rules)), stub `HerokuApiClient.prototype.get` as well and return a duck-typed `{json: async () => fixture}` rather than a real `Response`:

```ts
apiGet = sinon.stub(HerokuApiClient.prototype, 'get')
apiGet.withArgs('/apps/myapp?extended=true').resolves({json: async () => appExtended})
```

Wire each test's behavior with `.resolves(...)`, and assert routing with `.calledOnceWithExactly(...)` where the flag-to-method mapping is the thing you're testing. On tests that only check output formatting, the routing assertion is just noise, so leave it off:

```ts
fakePlatform.app.describe.resolves({addons, app: appAcm, collaborators, dynos, pipelineCoupling: null})
const {stdout} = await runCommand(Info, ['-a', 'myapp'])
expect(fakePlatform.app.describe.calledOnceWithExactly('myapp')).to.equal(true)
```

### The one assumption everything rests on, a single HerokuSDK per run()

This pattern reads cleanest when one thing is true: the command creates `new HerokuSDK()` once per `run()` and reads `.platform` after `beforeEach` has installed the stub. Two things can go wrong when it isn't:
- The dangerous case is a `platform` / `ctx.platform` reference captured before the stub is installed. It holds a real, unstubbed client, the stub never applies to it, and the test quietly stops testing what you think it does.
- The stub replaces the getter on `HerokuSDK.prototype`, so every instance built at any time resolves through it, but building the SDK more than once trips up `calledOnce` assertions (more on that below).

Here's the shape you want. `src/commands/apps/create.ts` builds the SDK once at the top of `run()` (line 201) and passes `platform` into its helpers as a parameter:

  ```ts
  // apps/create.ts:22
  type Platform = HerokuSDK['platform']

  // apps/create.ts:33 helper accepts platform, never instantiates its own SDK
  async function createApp(context, platform: Platform, name, stack) {
    const app = (params.space || params.team)
      ? await platform.teamApp.create(params as TeamAppCreateOpts) as App
      : await platform.app.create(params as AppCreateOpts)
    return app
  }

  // apps/create.ts:201 single instance, threaded to createApp / addAddons / addConfigVars
  const {platform} = new HerokuSDK()
  ```

And here's the shape to avoid. `src/commands/addons/upgrade.ts` builds the SDK twice, once inside `getPlans()` (line 89) and again in `run()` (line 102):

  ```ts
  // addons/upgrade.ts:89 second instance, inside a helper
  const {platform} = new HerokuSDK({extensions: [addOnExtensions]})
  // addons/upgrade.ts:102 first instance, in run()
  const {platform} = new HerokuSDK({extensions: [addOnExtensions]})
  ```

A single `sinon.stub(HerokuSDK.prototype, 'platform').get(...)` still works here, since `platform` is a getter on `HerokuSDK.prototype` and the stub replaces it for every instance no matter how many you build. The cost of two instances shows up in the assertions. When both instances call the same stubbed method, a `calledOnceWithExactly(...)` check fails with "called twice," so you end up loosening routing assertions to paper over a structural problem.

The fix is the same every time. When a helper needs the SDK, give it a `platform: Platform` parameter and build the SDK once in `run()`. For `addons/upgrade.ts`, that means `getPlans()` takes `platform` from the single instance `run()` created, instead of spinning up its own.

---

## 7. Backwards-compatibility rules

The migration should be invisible from the outside.

Same bytes out. stdout, stderr, exit codes, and JSON keys all stay identical. The JSON and shell contract is snake_case, so preserve it exactly and do the rename at the output boundary (see [Business-logic placement](#4-business-logic-placement)).

Handle strict-null types without touching output. `@heroku/types/3.sdk` is stricter than the old `@heroku-cli/schema`; `web_url` is now `string | null`, for instance. The tempting fix is to coalesce (`?? ''`, `?? 0`), but that quietly changes what prints: `web_url=null` would become `web_url=`. Don't. Reach for an `as` cast at a call site the runtime already guards (`filesize(info.app.repo_size as number, ...)`), or loosen a local consumer's signature (`function print(k: string, v: unknown)`).

Don't add truthiness gates the old code didn't have. A type fix that skips a field the original always printed isn't a type fix, it's a behavior change in disguise.

### CLI-only escape hatch (see [SKILL.md](./SKILL.md#step-12b-cli-only-escape-hatches-via-herokuapiclient))

Sometimes a variant exists on the platform but the SDK doesn't expose it. The canonical case is `GET /apps/{id}?extended=true`, which the route table collapses down to plain `app.info`. When something really is a CLI-only concern, drop straight to `HerokuApiClient` instead of keeping a lone `this.heroku.<verb>` call threaded through the command:

```ts
import {HerokuApiClient} from '@heroku/heroku-fetch'

const client = new HerokuApiClient()
const response = await client.get(`/apps/${app}?extended=true`)
const appExtended = await response.json() as ExtendedApp
```

To test, stub `HerokuApiClient.prototype.get` (see [Test pattern for SDK stubbing](#6-test-pattern-for-sdk-stubbing)).

---

## 8. Worked example, apps:info end to end

`src/commands/apps/info.ts` is a good example. It hits most of this guide in one small command.

Imports and type aliases (lines 1-18). The composite return type from the SDK resource file, the SDK itself, the extension, and a platform alias parameterized by that extension:

```ts
import type {AppInfo} from '@heroku/sdk/resources/platform/app/info'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {appExtensions} from '@heroku/sdk/extensions/platform'
import {ExtendedApp} from '../../lib/types/app.js'

type Platform = HerokuSDK<readonly [typeof appExtensions]>['platform']
type Info = Omit<AppInfo, 'app'> & {app: ExtendedApp}
```

Single SDK instance in `run()` (line 57), passed to the helper:

```ts
const {platform} = new HerokuSDK({extensions: [appExtensions]})
const info = await getInfo(app, platform, flags.extended)
```

Helper takes `platform`, uses the composite, and applies the escape hatch for `--extended` (lines 106-118):

```ts
async function getInfo(app: string, platform: Platform, extended: boolean): Promise<Info> {
  const data: Info = await platform.app.describe(app)   // composite: fans out several endpoints
  if (extended) {
    const client = new HerokuApiClient()
    const response = await client.get(`/apps/${app}?extended=true`)
    const appExtended = await response.json() as ExtendedApp
    appExtended.acm = data.app.acm
    data.app = appExtended
  }

  return data
}
```

snake_case rename at the JSON output boundary (lines 93-95):

```ts
} else if (flags.json) {
  const {pipelineCoupling, ...rest} = info
  hux.styledJSON({...rest, pipeline_coupling: pipelineCoupling})
}
```

The test (`test/unit/commands/apps/info.unit.test.ts`) puts the pattern together. It builds a minimal `FakePlatform` (`{app: {describe: sinon.stub()}}`), stubs both the prototype getter and `HerokuApiClient.prototype.get` in `beforeEach` (lines 117-121), and wires each case with `fakePlatform.app.describe.resolves(...)`. The escape-hatch response is duck-typed, `apiGet.withArgs('/apps/myapp?extended=true').resolves({json: async () => appExtended})` (line 151), and routing is checked with `fakePlatform.app.describe.calledOnceWithExactly('myapp')` (line 140). No `nock` anywhere.

One gap against this guide: `apps:info`'s `run()` still returns void. Per [run() return value](#5-run-return-value), the natural backfill is to return `info`, the `Info` object it already has in hand.

---

## 9. Self-review checklist

- [ ] Codemod runs first; every `// TODO(sdk-migration):` marker resolved.
- [ ] No `this.heroku.<verb>` calls and no bare helper `heroku.<verb>` calls remain.
- [ ] Composite methods used where a `Promise.all` fan-out existed; their extensions are registered via `{extensions: [...]}` (verified against a sibling command or smoke test).
- [ ] `@heroku-cli/schema` gone; types come from `@heroku/types/3.sdk`, SDK resource files, or `src/lib/types/`.
- [ ] Business logic sits in the right tier; snake_case renames happen at the output boundary, not threaded through helpers.
- [ ] Exactly one `new HerokuSDK()` per `run()`; helpers accept `platform`/`data` as a parameter and never instantiate their own SDK.
- [ ] `run()` returns the SDK-shaped data, or the case is a documented carve-out (streaming, interactive-TTY, or progressive-stdout).
- [ ] Namespace convention followed: `data.*` for data-plane, `platform.*` for platform-plane.
- [ ] Backwards-compat preserved: identical stdout/stderr/exit-codes/JSON keys; no silent null coalescing; no new truthiness gates.
- [ ] Tests rewritten: `nock` removed, SDK stubbed via `HerokuSDK.prototype.platform`; escape hatch (if any) stubs `HerokuApiClient.prototype.get` with a duck-typed `{json}` return.
- [ ] tsc clean vs. baseline; eslint clean on changed files; two commits; PR against `v12.0.0`.
