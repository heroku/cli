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
  // The action we rewrite those specs to point at.
  const WIRED = /:app:_heroku_complete_app/g
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
    // splitting `apps:info` — guard both halves of it.
    expect(bashAfter).to.include('--app|-a) __flag=app ;;')
    expect(bashAfter).to.include('autocomplete:__suggest --flag "$__flag"')
  })
})
