import {Config} from '@oclif/core'
import {expect} from 'chai'
import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {injectDynamicCompletions} from '../../../src/lib/autocomplete/inject.js'

/**
 * Contract test for the dynamic-completion injection.
 *
 * `injectDynamicCompletions` does not generate completion scripts — it string-
 * patches the ones `@oclif/plugin-autocomplete` writes. Those patches are regex
 * rewrites against the *plugin's* output, so they silently become no-ops if a
 * plugin upgrade changes that output's shape (the `.replace` matches nothing,
 * returns the input unchanged, and completions quietly stop offering live values
 * with no error).
 *
 * This test therefore runs the REAL plugin generator (not a fixture) and asserts
 * our injection actually bit. The point is the seam between the plugin's output
 * and our regexes: if a plugin bump changes the format, the assertions below go
 * red in CI instead of breaking silently in users' shells. Each assertion maps to
 * one anchor in src/lib/autocomplete/inject.ts.
 */
describe('autocomplete dynamic-completion injection (contract)', function () {
  // Loads the full CLI config and generates every completion spec — far slower
  // than a typical unit test, so give it room.
  this.timeout(120_000)

  // Mirror the exact spec shape inject.ts rewrites: `"--app=-[desc]:"`.
  const APP_SPEC = /"(?:\*)?--app=-\[[^\]]*]:"/g
  // A fully-rewired --app FLAG value spec. Deliberately the whole spec, not just
  // the `:app:_heroku_complete_app` tail, so it does not also count the identical
  // tail on positional specs (`"2:app:_heroku_complete_app"`, see D2 below).
  const WIRED = /"(?:\*)?--app=-\[[^\]]*]:app:_heroku_complete_app"/g
  // The bash anchor patchBash inserts after.
  const BASH_COMPREPLY_ANCHOR = /\n(\s*)COMPREPLY=\(\)\n/

  let originalCacheEnv: string | undefined
  let tmp: string
  let zshBefore: string
  let zshAfter: string
  let bashBefore: string
  let bashAfter: string

  before(async function () {
    // cacheDir is computed at Config.load() from HEROKU_CACHE_DIR, so redirect
    // the generator into a throwaway dir and never touch the real cache.
    originalCacheEnv = process.env.HEROKU_CACHE_DIR
    tmp = mkdtempSync(path.join(tmpdir(), 'heroku-ac-contract-'))
    process.env.HEROKU_CACHE_DIR = tmp

    const config = await Config.load(process.cwd())
    const create = await config.findCommand('autocomplete:create')?.load()
    expect(create, '@oclif/plugin-autocomplete must provide autocomplete:create').to.not.be.undefined
    // Generate exactly as the plugin's own index command does: `Create.run([], config)`.
    await create!.run([], config)

    const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
    const zshPath = path.join(functionsDir, 'zsh', `_${config.bin}`)
    const bashPath = path.join(functionsDir, 'bash', `${config.bin}.bash`)

    zshBefore = readFileSync(zshPath, 'utf8')
    bashBefore = readFileSync(bashPath, 'utf8')
    await injectDynamicCompletions(config)
    zshAfter = readFileSync(zshPath, 'utf8')
    bashAfter = readFileSync(bashPath, 'utf8')
  })

  after(function () {
    if (originalCacheEnv === undefined) delete process.env.HEROKU_CACHE_DIR
    else process.env.HEROKU_CACHE_DIR = originalCacheEnv
    if (tmp) rmSync(tmp, {force: true, recursive: true})
  })

  it('the plugin still emits the zsh function opener patchZsh anchors on', function () {
    // Guards inject.ts: `out.replace('_<bin> () {\n', ...)`.
    expect(zshBefore).to.include('_heroku () {')
  })

  it('the plugin still emits option-flag value specs in the shape patchZsh rewrites', function () {
    // Guards inject.ts: the `"--app=-[...]:"` rewrite regex.
    const appSpecs = zshBefore.match(APP_SPEC) ?? []
    expect(appSpecs.length, 'plugin should emit at least one --app value spec').to.be.greaterThan(0)
  })

  it('rewires every app spec to the dynamic helper (none missed)', function () {
    const appSpecs = (zshBefore.match(APP_SPEC) ?? []).length
    const wired = (zshAfter.match(WIRED) ?? []).length
    expect(zshAfter, 'helper should be defined once').to.include('_heroku_complete_app () {')
    expect(wired, 'every --app spec should be rewired').to.equal(appSpecs)
  })

  it('the zsh helper shells out to __suggest with the explicit --flag', function () {
    expect(zshAfter).to.include('autocomplete:__suggest --flag app')
  })

  it('the plugin still emits the bash COMPREPLY anchor patchBash inserts after', function () {
    // Guards inject.ts: `src.replace(/\n(\s*)COMPREPLY=\(\)\n/, ...)`.
    expect(BASH_COMPREPLY_ANCHOR.test(bashBefore), 'bash should contain a COMPREPLY=() line').to.be.true
  })

  it('injects the bash dynamic-value prologue right after COMPREPLY=()', function () {
    const marker = '# >>> heroku dynamic value completion'
    expect(bashAfter).to.include(marker)
    // The prologue must sit immediately after the first `COMPREPLY=()`, so it
    // short-circuits the plugin's name completion rather than running too late.
    const anchor = bashAfter.indexOf('COMPREPLY=()')
    const markerAt = bashAfter.indexOf(marker)
    expect(markerAt, 'prologue should follow the first COMPREPLY=()').to.be.greaterThan(anchor)
    expect(bashAfter.slice(anchor, markerAt).trim(), 'nothing should sit between them').to.equal('COMPREPLY=()')
  })

  it('derives the flag from $__prev and passes it explicitly to __suggest (bash)', function () {
    // The explicit --flag protocol is what keeps bash immune to COMP_WORDBREAKS
    // splitting `apps:info` — guard both halves of it. Long flag names only: a
    // short char is reused across commands for unrelated flags, so it is not
    // wired (see collectBindings in inject.ts).
    expect(bashAfter).to.include('--app) __flag=app ;;')
    expect(bashAfter).to.include('autocomplete:__suggest --flag "$__flag"')
    expect(bashAfter, 'short chars must not be wired globally').to.not.include('-a) __flag=app')
  })

  it('binds a flag to a completion id that differs from its long name (--size -> dynosize)', function () {
    // The metadata-driven resolver reads the flag's `completion:` by reference,
    // so `--size` wires to the `dynosize` id even though the names differ — the
    // exact case a name-match binding could not express.
    expect(bashAfter).to.include('--size) __flag=dynosize ;;')
    expect(zshAfter).to.include('_heroku_complete_dynosize () {')
    expect(zshAfter).to.include('autocomplete:__suggest --flag dynosize')
    expect(zshAfter, 'every --size spec should be rewired').to.match(/"--size=-\[[^\]]*]:dynosize:_heroku_complete_dynosize"/)
  })

  it('wires the account-wide completions restored in this slice', function () {
    // team/pipeline resolve by name (factory flags carry no completion:);
    // space/region/stack resolve by their explicit completion: metadata.
    for (const [longName, id] of [['team', 'team'], ['pipeline', 'pipeline'], ['space', 'space'], ['region', 'region'], ['stack', 'stack']]) {
      expect(bashAfter, `${longName} -> ${id} (bash)`).to.include(`--${longName}) __flag=${id} ;;`)
      expect(zshAfter, `${id} helper (zsh)`).to.include(`_heroku_complete_${id} () {`)
    }
  })

  it('wires the static and local-context completions mirrored from @heroku-cli/command', function () {
    // Reference-identity bindings (the flag carries an explicit completion: singleton):
    //   --buildpack (apps:create), --role (members:*), --scope (authorizations:create),
    //   --stage (pipelines:*), and --process-type (logs/ps:stop/ps:restart) -> processtype.
    // Name fallback (flags.remote() carries no completion: of its own): --remote.
    for (const [longName, id] of [
      ['buildpack', 'buildpack'],
      ['role', 'role'],
      ['scope', 'scope'],
      ['stage', 'stage'],
      ['process-type', 'processtype'],
      ['remote', 'remote'],
    ]) {
      expect(bashAfter, `${longName} -> ${id} (bash)`).to.include(`--${longName}) __flag=${id} ;;`)
      expect(zshAfter, `${id} helper (zsh)`).to.include(`_heroku_complete_${id} () {`)
      expect(zshAfter, `${id} suggest (zsh)`).to.include(`autocomplete:__suggest --flag ${id}`)
    }
  })

  it('never wires the overloaded --type flag (process type vs the pg:quotas enum)', function () {
    // `--type` is a process type on run/ps:wait but a quota enum on pg:quotas:*.
    // Global-by-name wiring can't tell them apart, so it must be bound to nothing
    // in both shells; the unambiguous --process-type carries process-type completion.
    expect(bashAfter, '--type must not appear in the bash flag case').to.not.include('--type)')
    expect(zshAfter, '--type must not be rewired to a helper in zsh').to.not.match(/"--type=-\[[^\]]*]:processtype:/)
  })

  it('wires static-enum flags (options: with no completion:) by their long name', function () {
    // These flags declare `options: [...]` but no `completion:`; each long name is
    // used by exactly one visible command, so a global-by-name binding is safe.
    //   --network (data:pg:create), --generation (spaces:create),
    //   --enforcement-action (data:pg:quotas:update).
    for (const [longName, id] of [
      ['network', 'pgnetwork'],
      ['generation', 'generation'],
      ['enforcement-action', 'enforcementaction'],
    ]) {
      expect(bashAfter, `${longName} -> ${id} (bash)`).to.include(`--${longName}) __flag=${id} ;;`)
      expect(zshAfter, `${id} helper (zsh)`).to.include(`_heroku_complete_${id} () {`)
      expect(zshAfter, `${id} suggest (zsh)`).to.include(`autocomplete:__suggest --flag ${id}`)
    }
  })

  it('wires --dyno/--dyno-name to the app-scoped dyno completion', function () {
    // Both long names (logs/ps:* split the spelling) resolve to the `dyno` id;
    // bash collapses them into one `|`-joined branch, so match that shape.
    expect(bashAfter, 'both dyno long names share one dyno branch').to.match(/--dyno(-name)?\|--dyno(-name)?\) __flag=dyno;/)
    expect(zshAfter, 'dyno helper (zsh)').to.include('_heroku_complete_dyno () {')
  })

  it('forwards the --app context only for app-scoped ids (dyno), not plain ones (app)', function () {
    // zsh: the dyno helper threads $opt_args[--app]; the app helper does not.
    // eslint-disable-next-line no-template-curly-in-string -- literal zsh parameter expansion in the generated script
    const dynoForward = 'autocomplete:__suggest --flag dyno --app "${opt_args[--app]:-$opt_args[-a]}"'
    expect(zshAfter, 'dyno helper forwards --app').to.include(dynoForward)
    expect(zshAfter, 'app helper must not forward --app').to.include('autocomplete:__suggest --flag app 2>/dev/null')
    // bash: the dyno branch sets __appscoped=1 and the prologue scans for --app;
    // the app branch is unmarked.
    expect(bashAfter, 'dyno branch is app-scoped').to.match(/--dyno(-name)?\|--dyno(-name)?\) __flag=dyno; __appscoped=1 ;;/)
    expect(bashAfter, 'app branch is not app-scoped').to.include('--app) __flag=app ;;')
    expect(bashAfter, 'prologue scans COMP_WORDS for --app').to.include('__appargs=(--app')
  })

  // --- D2: positional-argument value completion (zsh only) ---------------------

  // Return the `_set_flags` case arm (its `_command_flags=(...)` body) for a
  // command, so a positional spec assertion is scoped to that one command rather
  // than matching a coincidentally-identical spec elsewhere in the file.
  function zshArm(id: string): string {
    const start = zshAfter.indexOf(`\n${id})\n  _command_flags=(\n`)
    expect(start, `generated zsh must have a _set_flags arm for ${id}`).to.be.greaterThan(-1)
    const end = zshAfter.indexOf('\n  )\n', start)
    return zshAfter.slice(start, end)
  }

  it('wires positional args to their completion id, scoped per command (zsh)', function () {
    // Each command's first real positional is _arguments position 2 (position 1
    // is the command id itself). App-scoped ids (addon/release/dyno/configvar)
    // reuse the very same helpers the flag path defines.
    for (const [id, completionId] of [
      ['releases:info', 'release'],
      ['config:get', 'configvar'],
      ['config:edit', 'configvar'],
      ['ps:restart', 'dyno'],
      ['addons:info', 'addon'],
      ['addons:detach', 'addon'],
      ['pipelines:info', 'pipeline'],
      ['reviewapps:wait', 'app'],
    ]) {
      expect(zshArm(id), `${id} positional`).to.include(`"2:${completionId}:_heroku_complete_${completionId}"`)
      expect(zshAfter, `${completionId} helper defined`).to.include(`_heroku_complete_${completionId} () {`)
    }
  })

  it('routes zsh positional completion through _arguments with a file fallback', function () {
    // The plugin's own `if [[ "$_cur" == -* ]] ... else _path_files` branch is
    // replaced so _command_flags (now carrying positional specs) is always built
    // and _arguments dispatches; a trailing catch-all keeps file completion for
    // positions we do not complete.
    expect(zshAfter, 'the plugin flag/file branch must be removed').to.not.match(/if \[\[ "\$_cur" == -\* \]\]/)
    expect(zshAfter, 'file fallback for uncompleted positionals').to.include("'*:file:_path_files'")
  })

  it('skips positional completion for new-name, overloaded, and hidden args (zsh)', function () {
    // apps:create/spaces:create name a NEW resource; keys:*/certs: reuse key/KEY
    // for an SSH key / cert path; addon-service-capabilities takes an addon
    // SERVICE; apps:info's `app` positional is hidden (its value comes via --app).
    for (const id of ['apps:create', 'spaces:create', 'keys:add', 'keys:remove', 'certs:add', 'addon-service-capabilities', 'apps:info', 'spaces:info']) {
      expect(zshArm(id), `${id} must have no positional helper spec`).to.not.match(/"\d+:[a-z]+:_heroku_complete_[a-z]+"/)
    }
  })

  it('does not wire positional-only completions into bash (zsh-only slice)', function () {
    // addon/release/configvar are reachable only as positionals, which bash does
    // not complete yet, so the bash script must not reference their helpers/ids.
    for (const id of ['addon', 'release', 'configvar']) {
      expect(bashAfter, `bash must not reference ${id}`).to.not.include(`__flag=${id}`)
    }
  })
})
