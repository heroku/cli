# Autocomplete Migration Plan: Homegrown → `@oclif/plugin-autocomplete`

**Branch:** `eb/oclif-autocomplete-plugin` (off `v12.0.0`)
**Status:** Draft / experiment — spike 1 (static completion) done
**Goal:** Replace the Heroku CLI's homegrown autocomplete implementation with
[`@oclif/plugin-autocomplete`](https://github.com/oclif/plugin-autocomplete) as the base,
re-adding only the Heroku-specific capabilities the plugin does not provide (chiefly
dynamic, API-backed value completion).

---

## 0. Spike 1 findings (static completion) — 2026-10-12
Removed the entire homegrown implementation (kept `autocomplete-scripts/brew/`), wired in
`@oclif/plugin-autocomplete@4.0.4`, and verified static completion end-to-end.

**What works** (bash + zsh, verified by driving the generated completion functions):
- Command-name completion: `heroku apps:<TAB>` → `apps:create apps:info …`
- Flag-name completion: `heroku spaces:create --<TAB>` → `--cidr --generation --region …`
- Build, lint (0 errors), and test typecheck all pass with the homegrown code gone.

**Material discovery — colon separator disables static *value* completion.**
The plugin ships two generator families: a modern **space-separated** set (`zsh.js`
`ZshCompWithSpaces`, `bash-spaces.js`) that emits flag-enum values and arg completion, and a
**legacy colon-separated** set used when `config.topicSeparator === ':'` (Heroku's case) or
`OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR=colon`. The legacy generators (`genZshFlagSpecs` /
bash `compgen -W`) complete only command and flag *names* — they **never read `flag.options`**,
so `heroku spaces:create --generation=<TAB>` offers nothing (not `cedar`/`fir`).

Implications:
- This is **not a regression**: the old homegrown zsh generator also only emitted value
  completion for flags carrying a Heroku `Completion`, not for plain static `options` enums.
- But it means **even static enum values must flow through the same dynamic callback** we build
  in Phase 3 (there is no "free" static-value completion in colon mode) — *unless* we switch
  the CLI to space-separated topics, which is a CLI-wide UX change and out of scope here.
- The Option A override therefore needs to cover both static-enum and API-backed values; the
  spike's job (next) is to prove we can inject that callback into the legacy colon generators.

**Shared-cache caveat (confirmed):** the completion cache dir
(`~/Library/Caches/heroku/autocomplete`) is keyed to the bin name `heroku`, so `./bin/run.js`
and an installed `heroku` write the **same** location — last writer wins. Regenerate with the
dev binary immediately before testing. The plugin writes a `functions/` subdir (absent from the
homegrown impl), which is a clean provenance fingerprint.

---

## 0.1 Spike 2 findings (dynamic completion, Option A) — 2026-10-12
Proved the Option A injection mechanism end-to-end for bash + zsh. Added (uncommitted):
`src/lib/types/completion.ts`, `src/lib/autocomplete/completions.ts` (SDK-backed `AppCompletion`
via `platform.app.listOwnedAndCollaborated('~')`), `src/commands/autocomplete/options.ts`
(hidden `autocomplete:options` command), `src/lib/autocomplete/inject.ts` (script patcher), and
`src/hooks/postrun/inject-dynamic-completions.ts` (trigger). Registered the postrun hook in
`package.json`.

**Mechanism (why so little configuration was possible).** The plugin exports nothing importable
(`export default {}`, subpaths blocked by its exports map), so we cannot subclass its commands or
feed it a template. The only seam is to **patch the scripts it writes to the cache.** A `postrun`
hook fires after `autocomplete` / `autocomplete:create` regenerate the cache and runs
`injectDynamicCompletions()`, which does two string transforms:
- **zsh**: each option flag is emitted as `"--app=-[desc]:"` — a dead `_arguments` action. We
  inject a `_heroku_dynamic_completion` helper once and rewrite every dynamic-flag spec to
  `"--app=-[desc]:app:_heroku_dynamic_completion"`. The helper shells out to
  `heroku autocomplete:options "<line>"` and `compadd`s the result.
- **bash**: the generated function only completes names, so we prepend a prologue that detects a
  dynamic-flag value position (`--app`/`-a`, incl. the `=` split) and feeds `autocomplete:options`
  output into `COMPREPLY`.

**What's verified:** a from-scratch regen patches all 295 `--app` specs (0 left), both scripts
pass `zsh -n` / `bash -n`, and driving the *real* generated functions with a stubbed
`autocomplete:options` returns completions in both shells (bash `COMPREPLY`, zsh `compadd`). Build
and lint are clean.

**What's NOT verified:** the live SDK call. The environment is **not logged in** (no
`HEROKU_API_KEY`, no `~/.netrc` heroku entry, nothing in an accessible keychain), so
`platform.app.listOwnedAndCollaborated('~')` fails auth and the command's try/catch returns empty
— correct behavior, but it means `heroku apps:info --app=<TAB>` → *live apps* is still unproven.
Acid test once authed: `./bin/run.js autocomplete:options 'heroku apps:info --app='` should print
app names.

**Material discovery — PowerShell is hard-blocked in colon mode (feeds Phase 4).** Confirmed
against the running CLI: `heroku autocomplete powershell` **errors** ("PowerShell completion is
not supported in CLIs using colon as the topic separator"), and a full regen writes **no `.ps1`**
(only an empty `functions/powershell/` dir). In the plugin, `index.js` `this.error()`s for
`powershell` when `topicSeparator === ':'`, and `create.js` only writes the PowerShell function in
its *space-separator* branch. So there is **no static PowerShell completion to adopt** while
Heroku uses colon topics — this invalidates the earlier §7.5 assumption and reshapes Phase 4
(below). Not a regression: the homegrown impl never shipped PowerShell either.

---

## 1. Motivation

The Heroku CLI ships a bespoke autocomplete subsystem that predates (and overlaps heavily
with) the oclif-maintained `@oclif/plugin-autocomplete`. Both generate bash/zsh completion
scripts from command/flag metadata using essentially the same approach. Maintaining our own
fork of this logic is a cost we'd like to shed:

- The plugin is actively maintained by oclif (currently `4.x`) and tracks oclif core changes.
  (It *has* a PowerShell generator, but — as Spike 2 found, §0.1 — it's unusable while Heroku
  uses colon topics, so this is not a near-term win for us.)
- Our homegrown code carries shell-script generation, caching, and diagnostics we have to
  maintain ourselves.

The catch: **our implementation does extra things the plugin does not.** The plugin only
produces *static* completion from command/flag metadata (and a flag's static `options`
enum array). It has **no concept of dynamic, runtime value completion** — no equivalent of
our `autocomplete:options` command that calls the Heroku API at completion time to list
your apps, teams, spaces, pipelines, add-ons, dynos, config vars, etc. So the plan is:
**adopt the plugin as the base, then extend it to restore dynamic completion.**

---

## 2. Current State — Inventory of the Homegrown Implementation

Everything that must be understood (and mostly deleted) before re-implementing.

### 2.1 Commands (`src/commands/autocomplete/`)
| File | Purpose | Public? |
|------|---------|---------|
| `index.ts` | `heroku autocomplete [SHELL]` — prints install instructions, builds cache, `--refresh-cache` | public |
| `create.ts` | Generates the bash/zsh setup scripts + command/flag setter files into the cache dir | hidden |
| `options.ts` | `heroku autocomplete:options` — **the dynamic engine**; invoked by shell functions at completion time to emit live values | hidden |
| `script.ts` | Prints the `source …` snippet users add to their shell rc | hidden |
| `doctor.ts` | `heroku autocomplete:doctor` — diagnostic; verifies shim/cache presence, lists completable commands | hidden |

### 2.2 Library (`src/lib/autocomplete/`)
- `base.ts` — `AutocompleteBase` command base (cache dir paths, shell validation, `findCompletion`, log file).
- `completions.ts` — **the Heroku-specific extra stuff.** API calls go through a hand-rolled
  `herokuGet` helper (`new APIClient(ctx.config).get('/<resource>')`); the migration replaces
  this with `@heroku/sdk` (§7.7). Defines ~17 `Completion` objects
  (`AppCompletion`, `AppAddonCompletion`, `AppDynoCompletion`, `ConfigCompletion`,
  `ConfigSetCompletion`, `DynoSizeCompletion`, `PipelineCompletion`, `RegionCompletion`,
  `SpaceCompletion`, `StackCompletion`, `TeamCompletion`, plus static/local ones:
  `BuildpackCompletion`, `FileCompletion`, `ProcessTypeCompletion`, `ProtocolCompletion`,
  `RemoteCompletion`, `RoleCompletion`, `ScopeCompletion`, `StageCompletion`). Also the
  `CompletionMapping` registry and the `CompletionLookup` class (arg/key/description aliasing
  + blocklisting, e.g. don't complete `app` on `apps:create`).
- `cache.ts` — `fetchCache` / `updateCache` / staleness logic (mtime vs `cacheDuration`).
- `src/lib/types/completion.ts` — `Completion` / `CompletionContext` interfaces.

### 2.3 Dynamic completion catalog (what we must preserve)
Backed by the Heroku Platform API via `herokuGet`, with per-key caching and `cacheKey`
scoping (several are scoped by `--app`):

- **Account-wide, cached:** `app`, `team`, `space`, `pipeline`, `region`, `stack`, `dynosize`
- **App-scoped, cached:** `addon` (`<app>_addons`), `dyno` (`<app>_dynos`),
  `config` (`<app>_config_vars`), `configSet` (`<app>_config_set_vars`)
- **Local/static (no API), `skipCache`:** `buildpack`, `file`, `processtype` (reads `Procfile`),
  `protocol`, `remote` (git remotes), `role`, `scope`, `stage`
- **Env-var aware:** `--app`/`--team` resolution honors `HEROKU_APP`, `HEROKU_TEAM`, `HEROKU_ORG`.

> ⚠️ There is a **parallel copy** of these `Completion` objects in the external
> `@heroku-cli/command` package (`@heroku-cli/command/lib/completions.js`). 19 commands import
> from there and set `completion:` on their flags (e.g. `apps/index.ts` →
> `SpaceCompletion`, `logs.ts` → `ProcessTypeCompletion`). The local copy in
> `src/lib/autocomplete/completions.ts` is used by the autocomplete commands themselves;
> the command-package copy is what flags reference. **Both must be reconciled.**

### 2.4 Hooks
- `src/hooks/recache.ts` — currently fully commented out (dead), but wired in `package.json`
  as the `recache` hook and referenced by the `update` hook chain.
- `src/hooks/update/completions.ts` — on CLI update, triggers the `recache` hook (skips Windows).

### 2.5 Static shell scripts (`autocomplete-scripts/`)
- `bash/heroku.bash`, `zsh/_heroku` — runtime completion functions sourced by the user's shell;
  these call back into `heroku autocomplete:options`.
- `brew/bash`, `brew/zsh/_heroku` — Homebrew-installed completion scripts.
- Referenced by `scripts/release/homebrew/templates/heroku.rb` (installs brew completions) and
  listed in `package.json` `files`.

### 2.6 Tests
- `test/unit/lib/autocomplete/{base,completions}.unit.test.ts`
- `test/unit/commands/autocomplete/{index,create,options,script}.unit.test.ts`
  (~581 lines total)
- `test/helpers/autocomplete/runtest.js`
- References in `test/acceptance/smoke.acceptance.test.ts` and `test/acceptance/commands-output.ts`.

### 2.7 Config & docs
- `package.json`: `aliases["heroku-cli-autocomplete"] = null`; `files` includes
  `/autocomplete-scripts`; hooks `recache` + `update/completions`.
- `docs/autocomplete.md` — generated command docs.
- Dev Center article: https://devcenter.heroku.com/articles/heroku-cli-autocomplete (external).

---

## 3. What the Plugin Provides vs. the Gap

| Capability | Homegrown | `@oclif/plugin-autocomplete` 4.x |
|---|---|---|
| `autocomplete [SHELL]` install command | ✅ | ✅ |
| `--refresh-cache` | ✅ | ✅ |
| bash completion | ✅ | ✅ |
| zsh completion | ✅ | ✅ |
| **PowerShell** completion | ❌ | ✅ |
| Static flag enum completion (`flag.options`) | partial | ✅ |
| colon **and** space topic separators | colon only | ✅ (`OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR`) |
| **Dynamic/API value completion at runtime** | ✅ (`autocomplete:options` + `CompletionMapping`) | ❌ **(the gap)** |
| Per-value caching w/ staleness + `cacheKey` scoping | ✅ | ❌ |
| `doctor` diagnostic | ✅ | ❌ |
| Cache invalidation hooks on login/logout/app/addon/config change | ✅ (historically; `recache` now dead) | ❌ |

**The core engineering problem** is bridging dynamic completion: the plugin generates static
zsh/bash scripts and defaults non-enum flags to `_files`. We need those scripts to instead
call back into a Heroku command that returns live, cached API values for flags/args tagged
with a Heroku `Completion`.

### 3.1 Guiding principle: prefer the plugin wherever both support a capability
**Whenever a capability is supported by both the plugin and our homegrown code, rely on the
plugin — do not carry our own version of it.** We only re-implement the genuine *gaps* (the
❌-in-plugin rows above: dynamic/API value completion, its cache layer, and `doctor`, which
has no plugin equivalent). Concretely:

- **Rely on the plugin for:** the `autocomplete` install command and its UX, `--refresh-cache`,
  all shell-script generation, command/flag-name completion, static flag-enum (`flag.options`)
  completion, topic-separator handling, and bash/zsh/**PowerShell** support.
- **Only build:** the dynamic-value callback (Option A), its `Completion` catalog + cache, and
  a slimmed `doctor`.
- **Keep the Option A override thin.** The template customization should inject *only* the
  dynamic-value callback for Heroku-tagged flags; it must not re-implement script generation,
  install flow, or anything the plugin already does. If the override starts duplicating plugin
  behavior, that's a smell — push the need upstream instead.

---

## 4. Strategy

Two-stage, as the user suggested: **(A) rip it all out, (B) rebuild on the plugin.**
Keep each stage independently committed so we can bisect regressions. Throughout, follow the
guiding principle (§3.1): **prefer the plugin wherever both support a capability; build only
the gaps.**

### Phase 0 — Baseline & safety net
- [x] Branch created: `eb/oclif-autocomplete-plugin`.
- [ ] Capture current behavior as reference fixtures *before* deleting:
  - `heroku autocomplete:script bash` / `zsh` output
  - generated cache files (`~/.cache/heroku/autocomplete/*`)
  - `heroku autocomplete:options 'heroku apps:info --app='` sample output
  - `heroku autocomplete:doctor` output
- [ ] Note current `@oclif/core` version (`^4.8.4`) for plugin compatibility.

### Phase 1 — Delete the homegrown implementation
Remove, in one commit, so `main`-vs-branch diff is legible:
- [ ] `src/commands/autocomplete/` (all 5 files)
- [ ] `src/lib/autocomplete/` (base, completions, cache)
- [ ] `src/lib/types/completion.ts`
- [ ] `src/hooks/recache.ts` and `src/hooks/update/completions.ts`
- [ ] `autocomplete-scripts/bash/`, `autocomplete-scripts/zsh/`, `autocomplete-scripts/README.md`
      — but **keep `autocomplete-scripts/brew/`** (Homebrew formula still installs it; decision §7.6)
- [ ] All autocomplete tests (§2.6) and helper
- [ ] `package.json`: remove `recache` hook and `update/completions` hook entry. Keep
      `/autocomplete-scripts` in `files` (brew subdir still ships; decision §7.6)
- [ ] Temporarily **neutralize `completion:` references on command flags** so the build
      compiles. Two options: (a) strip the `completion:` props from the 19 commands, or
      (b) leave them (they're ignored if nothing reads them) — verify TS still compiles
      given `completion` is **not** natively typed by `@oclif/core`. Prefer leaving them
      in place to minimize churn and because we'll re-wire them in Phase 3.
- [ ] Verify: `npm run build`, lint, and the full test suite pass with autocomplete gone.

### Phase 2 — Install the plugin as the baseline
- [ ] `npm install --package-lock-only @oclif/plugin-autocomplete@^4` then `npm install`
      (respect lockfile convention — do not regenerate the whole lockfile).
- [ ] Add `@oclif/plugin-autocomplete` to `oclif.plugins` in `package.json`.
- [ ] Decide topic-separator behavior: Heroku uses colons (`apps:info`). Confirm default
      behavior matches or set `OCLIF_AUTOCOMPLETE_TOPIC_SEPARATOR=colon` expectations.
- [ ] Smoke test: `heroku autocomplete`, `heroku autocomplete zsh`, install the script in a
      throwaway shell, confirm **command and flag-name** completion works end to end.
- [ ] Confirm the plugin's install instructions / env-var names don't collide with leftover
      `HEROKU_AC_*` references anywhere.

### Phase 3 — Re-implement dynamic (API-backed) completion as an extension (Option A)
**Decided (§7.1): Option A** — override/post-process the plugin's shell templates to call a
slim Heroku `autocomplete:options` command. Re-introduce an `options`-style command (ported
from the old `options.ts` + `completions.ts` + `cache.ts`) and customize the generated
zsh/bash completion functions so flags/args carrying a Heroku `Completion` emit a call to it
instead of `_files`. Confirm during the spike whether the plugin exposes a template hook or
whether we post-process its generated scripts.

- [ ] Port the `Completion` catalog (§2.3) and `CompletionLookup` aliasing/blocklist logic
      **into the CLI** for the spike (final home is `@heroku-cli/command` — see Phase 3b).
- [ ] Port the cache layer (`fetchCache`/`updateCache`, `cacheDuration`, `cacheKey` scoping,
      env-var resolution for `HEROKU_APP`/`HEROKU_TEAM`/`HEROKU_ORG`).
- [ ] Wire the generated scripts → `autocomplete:options` callback for Heroku-tagged flags/args.
- [ ] **Fetch data via `@heroku/sdk`, not `herokuGet` (§7.7).** Replace the hand-rolled
      `herokuGet` (which does `new APIClient(ctx.config).get('/<resource>')`) with the SDK's
      typed `platform.<resource>` methods, matching the rest of the v12 migration.
- [ ] Keep the in-CLI catalog's **shape aligned** with `@heroku-cli/command`'s existing exports
      so Phase 3b is a move, not a rewrite.

#### Data fetching: `@heroku/sdk` instead of `herokuGet` (§7.7)
Completions receive only a `CompletionContext` (`config`, parsed args/flags) — no `this.heroku`.
Thread auth/host into the SDK exactly as commands do, so keychain- and `HEROKU_HOST`-authed
users don't break (see `src/lib/apps/client-options.ts`):

```ts
import {APIClient} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {sdkClientOptions} from '../apps/client-options.js'

const heroku = new APIClient(ctx.config)
const {platform} = new HerokuSDK(sdkClientOptions(heroku))
const apps = await platform.app.listOwnedAndCollaborated()
return apps.map(a => a.name).sort()
```

Resource → SDK method mapping (verify exact names against the installed `@heroku/sdk@^0.8.1`
during the spike — a few are not yet exercised elsewhere in the CLI):

| Completion | Today (`herokuGet`) | SDK method |
|---|---|---|
| `app` | `users/~/apps` + per-team `teams/<t>/apps` | `platform.app.listOwnedAndCollaborated()` (collapses both calls) — or `platform.app.list()` + `platform.teamApp.listByTeam()` |
| `team` | `teams` | `platform.team.list()` |
| `pipeline` | `pipelines` | `platform.pipeline.list()` |
| `region` | `regions` | `platform.region.list()` |
| `addon` (app-scoped) | `apps/<app>/addons` | `platform.addOn.listByApp(app)` |
| `dyno` (app-scoped) | `apps/<app>/dynos` | `platform.dyno.list(app)` |
| `config`/`configSet` (app-scoped) | `apps/<app>/config-vars` | `platform.configVar.infoForApp(app)` → `Object.keys(...)` |
| `space` | `spaces` | ⚠️ confirm `platform.space.list()` exists (only `space.info`/`spaceHost.list` seen in-repo) |
| `stack` | `stacks` | ⚠️ confirm `platform.stack.list()` |
| `dynosize` | `dyno-sizes` | ⚠️ confirm `platform.dynoSize.list()` |

Notes:
- The SDK returns typed objects; keep the existing `.map(x => x.name).sort()` / lowercase
  (`dynosize`) / `Object.keys` (`config`) shaping so completion output is unchanged.
- Local/static completions (`buildpack`, `file`, `processtype`, `protocol`, `remote`, `role`,
  `scope`, `stage`) make no API calls and are **unaffected** by this change.
- `listOwnedAndCollaborated` likely removes the N-teams fan-out in `AppCompletion` — a nice
  simplification, but confirm it returns the same set users expect to complete.
- `herokuGet` currently passes `{retryAuth: false}`; confirm the SDK's auth-failure behavior
  during completion is non-interactive (completions must never prompt).

### Phase 3b — Promote the catalog to `@heroku-cli/command` (§7.2)
Only after the Option A contract is proven in-CLI:
- [ ] Move the dynamic-completion contract + catalog into `@heroku-cli/command` as the single
      source of truth; cut a package release.
- [ ] Delete the CLI's local copy; import from the package.
- [ ] Re-point the 19 commands' `completion:` flag props at the package catalog; retire the
      now-stale parallel copy that previously lived there.

### Phase 4 — Hooks, `doctor`, PowerShell
- [ ] **Cache invalidation (§7.4): rely on TTL + `--refresh-cache`.** Do not restore the
      login/logout/app/addon/config invalidation hooks now; `cacheDuration` bounds staleness
      and the hooks are already dead in shipping code. Revisit on complaints.
- [ ] Re-wire the `update` hook only if completions should regenerate on CLI upgrade — verify
      whether the plugin handles its own recache first.
- [ ] **Port a slimmed `autocomplete:doctor` (§7.3)** — shim path, cache dir, logged-in state.

#### PowerShell completion (§7.5, revised by Spike 2)
PowerShell completion **does not exist today** and the plugin **cannot produce it** while Heroku
uses the colon topic separator — `autocomplete powershell` errors and no `.ps1` is written (see
§0.1). There is nothing to "adopt." This is **not a regression** (homegrown never shipped it), so
it is out of scope for the baseline migration and tracked here as a deferred option. Two paths, if
Windows completion becomes a priority:
- [ ] **(a) Author a PowerShell completer from scratch.** Write a `heroku.ps1` (the plugin won't
      generate one in colon mode) using `Register-ArgumentCompleter`, and add a PowerShell arm to
      `inject.ts` that wires dynamic flags to `autocomplete:options` via a scriptblock. PowerShell's
      completion API is scriptblock-native, so the dynamic shell-out is actually cleaner here than
      in bash/zsh. Cost: a hand-maintained completer with no plugin backing.
- [ ] **(b) Move the CLI to the space topic separator** (`heroku apps info`). This unlocks the
      plugin's modern generators — static *and* a cleaner value-completion story — for **all three**
      shells at once, retiring most of the Option A injection. Large, breaking UX change; a separate
      decision, not an autocomplete task.

### Phase 5 — Homebrew, packaging, docs
- [ ] **Homebrew (§7.6): keep the static brew scripts for now.** Leave
      `scripts/release/homebrew/templates/heroku.rb` installing from `autocomplete-scripts/brew/`;
      file a follow-up to investigate regenerating from the plugin.
- [ ] Confirm `package.json` `files` still ships `/autocomplete-scripts` (brew subdir).
- [ ] Regenerate `docs/autocomplete.md`; update the Dev Center article if command UX changed.

### Phase 6 — Validation
- [ ] Diff Phase 0 reference fixtures against new behavior; document intentional UX changes.
- [ ] Manual matrix: bash + zsh (and PowerShell if we adopt it) × command/flag/dynamic-value
      completion × logged-in/out × `--app` scoped (addons/dynos/config).
- [ ] Confirm `heroku apps:info --app=<TAB>` lists live apps (the acid test for dynamic completion).
- [ ] Decide the fate of `doctor` (port it, or drop it).

---

## 5. Deliverables per phase
- Phase 1: one "remove homegrown autocomplete" commit (brew scripts kept); green build/tests.
- Phase 2: plugin wired; static completion (bash/zsh/PowerShell) working.
- Phase 3: dynamic completion restored in-CLI via Option A, fetching through `@heroku/sdk`.
- Phase 3b: catalog promoted to `@heroku-cli/command`; local copy deleted; 19 commands re-pointed.
- Phases 4–6: slimmed `doctor` + PowerShell, static brew scripts retained, docs, validation.

---

## 6. Risks & Things That Will Bite Us
- **Dynamic completion is unsupported upstream** — this is the whole reason we "may need to
  extend the plugin." If no clean extension point exists, we're maintaining a shell-template
  override, which erodes the maintenance win. Validate feasibility in Phase 3 **early** (spike
  it before committing to full deletion-based rewrite).
- **Duplicate `Completion` catalog** in `@heroku-cli/command` (external package) that 19
  commands depend on. Changing the contract touches another repo/release.
- **Homebrew static completions** (`autocomplete-scripts/brew/*`) are installed by the brew
  formula independently of the CLI runtime; deleting the dir may break brew packaging.
- **Env-var / cache-path compatibility** — users have `HEROKU_AC_*_SETUP_PATH` lines in their
  shell rc files from the old installer. A migration may orphan those; `autocomplete:doctor`
  historically helped diagnose this.
- **Topic separator** — the plugin supports space-separated topics; Heroku is colon-based.
  Confirm no behavior drift.
- **`@oclif/core` version alignment** — plugin 4.x against our `@oclif/core ^4.8.4`.

---

## 7. Decisions (resolved)
1. **Extension strategy → Option A.** Keep a slim Heroku `autocomplete:options` command and
   override/post-process the plugin's generated zsh/bash scripts so Heroku-tagged flags call
   it instead of defaulting to file completion. Unblocked by upstream; preserves current UX.
   (Offer the generic parts upstream later as a stretch goal, but don't gate on it.)
2. **Catalog ownership → final home is `@heroku-cli/command`; spike starts in-CLI.** During the
   spike the catalog lives in the CLI so we iterate in one repo without cutting a package
   release per change. Once the dynamic-completion contract is proven, **promote it to
   `@heroku-cli/command`** (single source of truth, importable by external Heroku plugins) and
   delete the local copy. ⚠️ Keep the in-CLI copy's *shape* aligned with what
   `@heroku-cli/command` already exports so promotion is a move, not a rewrite — tracked as its
   own step (Phase 3b).
3. **`doctor` → port a slimmed version.** Cheap and useful for support on broken shell setups.
   Trim to what still applies post-migration (shim path, cache dir, logged-in state). Not
   needed for the spike; schedule in the rebuild phase.
4. **Cache-invalidation hooks → rely on TTL + `--refresh-cache` for now.** Per-key
   `cacheDuration` already bounds staleness, and today's shipping code has these hooks dead
   anyway, so this is no regression. Revisit if stale-completion complaints appear.
5. **PowerShell → deferred; nothing to adopt in colon mode.** ⚠️ *Revised by Spike 2 (§0.1).* The
   earlier assumption that static PowerShell completion was "free from the plugin" is **false** for
   Heroku: the plugin hard-blocks PowerShell (errors, writes no `.ps1`) whenever the topic
   separator is `:`. There is no static completer to adopt and no regression to worry about
   (homegrown never shipped PowerShell). Treat Windows completion as an out-of-scope follow-up with
   two paths — author a `.ps1` + injector by hand, or move the CLI to space-separated topics (which
   unlocks all three shells). See Phase 4 → "PowerShell completion".
6. **Homebrew → keep shipping static scripts for now.** Do **not** delete
   `autocomplete-scripts/brew/` in the deletion phase; keep the brew formula working.
   Investigate regenerating from the plugin as a follow-up once the runtime migration is proven.
7. **Data fetching → use `@heroku/sdk`, not `herokuGet`.** The dynamic completions should fetch
   via the SDK's typed `platform.<resource>` methods, consistent with the broader v12 SDK
   migration (cf. the `sdk-command-migration` playbook and recent `@heroku/sdk` refactors).
   Auth/host is threaded via `sdkClientOptions(new APIClient(ctx.config))`. Details + mapping
   under Phase 3 → "Data fetching". Keep output shaping identical so completion UX is unchanged.

---

## 8. Suggested first step
Before the big deletion, do a **throwaway spike** on this branch: install the plugin
alongside the existing implementation, generate its zsh script, and prove out one dynamic
completion (e.g. `--app=<TAB>` → live apps) via whichever extension approach looks cleanest.
That answer (Option A/B/C) de-risks the entire rewrite and should gate Phase 1.
