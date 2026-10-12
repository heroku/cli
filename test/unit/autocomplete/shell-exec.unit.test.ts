import {Config} from '@oclif/core'
import {expect} from 'chai'
import {execFileSync} from 'node:child_process'
import {
  existsSync, mkdtempSync, readFileSync, rmSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {injectDynamicCompletions} from '../../../src/lib/autocomplete/inject.js'

/**
 * Executes the REAL generated completion functions in a real bash / zsh and
 * asserts they offer live values. Where the sibling contract test checks the
 * SHAPE of our injection by string match, this checks its BEHAVIOR: that the
 * patched script actually resolves the flag, shells out to __suggest, and
 * populates the shell's completion array.
 *
 * `heroku` is stubbed to a shell function implementing only the __suggest ABI,
 * so these tests need no auth, network, or built CLI. They are gated on the
 * shell being present (skipped on Windows / where bash|zsh is absent) and avoid
 * interactive completion entirely — the function is invoked exactly as the shell
 * invokes it (bash: COMP_WORDS/COMP_CWORD set, then call; zsh: compadd captured),
 * which is deterministic, unlike a pty-driven TAB.
 *
 * The bash COMP_WORDS arrays below are the exact tokens bash produces for these
 * command lines under its default COMP_WORDBREAKS (which splits on `:` and `=`);
 * this was confirmed against an interactive pty. The `apps:info` -> `apps : info`
 * split is precisely the case that used to break value completion, so it is the
 * core scenario here.
 */
describe('autocomplete dynamic-completion injection (shell execution)', function () {
  this.timeout(120_000)

  const APPS = ['malachite-prod', 'malachite-staging', 'obsidian-www']
  let tmp: string
  let originalCacheEnv: string | undefined
  let bashPath: string
  let zshPath: string

  before(async function () {
    originalCacheEnv = process.env.HEROKU_CACHE_DIR
    tmp = mkdtempSync(path.join(tmpdir(), 'heroku-ac-exec-'))
    process.env.HEROKU_CACHE_DIR = tmp

    const config = await Config.load(process.cwd())
    const create = await config.findCommand('autocomplete:create')?.load()
    await create!.run([], config)
    await injectDynamicCompletions(config)

    const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
    bashPath = path.join(functionsDir, 'bash', `${config.bin}.bash`)
    zshPath = path.join(functionsDir, 'zsh', `_${config.bin}`)
  })

  after(function () {
    if (originalCacheEnv === undefined) delete process.env.HEROKU_CACHE_DIR
    else process.env.HEROKU_CACHE_DIR = originalCacheEnv
    if (tmp) rmSync(tmp, {force: true, recursive: true})
  })

  describe('bash', function () {
    beforeEach(function () {
      if (!hasShell('bash')) this.skip()
    })

    it('is syntactically valid after injection (bash -n)', function () {
      // execFileSync throws on non-zero exit; reaching the assertion means OK.
      execFileSync('bash', ['-n', bashPath])
      expect(true).to.equal(true)
    })

    it('offers every app for a bare `apps:info --app=`', function () {
      // heroku apps:info --app=  ->  heroku apps : info --app =
      const reply = runBash(['heroku', 'apps', ':', 'info', '--app', '='], 5, APPS)
      expect(reply).to.deep.equal(APPS)
    })

    it('offers every app for `apps:info --app ` (space, no `=`)', function () {
      // heroku apps:info --app   ->  heroku apps : info --app ''
      const reply = runBash(['heroku', 'apps', ':', 'info', '--app', ''], 5, APPS)
      expect(reply).to.deep.equal(APPS)
    })

    it('prefix-filters on the partial value in `apps:info --app=mala`', function () {
      const reply = runBash(['heroku', 'apps', ':', 'info', '--app', '=', 'mala'], 6, APPS)
      expect(reply).to.deep.equal(['malachite-prod', 'malachite-staging'])
    })

    it('fires for a flag whose completion id differs from its name (`run --size=`)', function () {
      // Proves the metadata binding reaches the shell: `--size` wires to the
      // `dynosize` id, so the prologue sets __flag=dynosize and shells out.
      // heroku run --size=  ->  heroku run --size =
      const SIZES = ['standard-1x', 'standard-2x', 'performance-m']
      const reply = runBash(['heroku', 'run', '--size', '='], 3, SIZES)
      expect(reply).to.deep.equal(SIZES)
    })

    it('does not fire for a non-dynamic flag (`--json`)', function () {
      // The prologue must fall through to the plugin's own name completion;
      // our live app values must not leak into an unrelated flag's position.
      const reply = runBash(['heroku', 'apps', ':', 'info', '--json', ''], 5, APPS)
      expect(reply).to.not.include('malachite-prod')
      expect(reply).to.not.include('obsidian-www')
    })

    it('treats values as data: a value with `$(...)` is never executed', function () {
      const sentinel = path.join(tmp, 'PWNED')
      // A malicious/odd value must land in COMPREPLY verbatim, not run as code.
      const evil = `evil$(touch ${sentinel})app`
      const reply = runBash(['heroku', 'apps', ':', 'info', '--app', ''], 5, ['safe-app', evil])
      expect(existsSync(sentinel), 'command substitution must not have run').to.be.false
      expect(reply).to.include(evil)
      expect(reply).to.include('safe-app')
    })

    it('treats values as data: backticks, leading-dash and spaces survive verbatim', function () {
      const sentinel = path.join(tmp, 'PWNED_BACKTICK')
      const backtick = `evil\`touch ${sentinel}\`app`
      const values = [backtick, '--rm-rf-flag-lookalike', 'has space value']
      const reply = runBash(['heroku', 'apps', ':', 'info', '--app', ''], 5, values)
      expect(existsSync(sentinel), 'backtick substitution must not have run').to.be.false
      for (const v of values) expect(reply, `value should survive verbatim: ${v}`).to.include(v)
    })
  })

  describe('zsh', function () {
    beforeEach(function () {
      if (!hasShell('zsh')) this.skip()
    })

    it('is syntactically valid after injection (zsh -n)', function () {
      execFileSync('zsh', ['-n', zshPath])
      expect(true).to.equal(true)
    })

    it('the generated helper compadds every live app value', function () {
      const reply = runZshHelper(zshPath, APPS)
      expect(reply).to.deep.equal(APPS)
    })

    it('treats values as data: a value with `$(...)` is never executed', function () {
      const sentinel = path.join(tmp, 'PWNED_ZSH')
      const evil = `evil$(touch ${sentinel})app`
      const reply = runZshHelper(zshPath, ['safe-app', evil])
      expect(existsSync(sentinel), 'command substitution must not have run').to.be.false
      expect(reply).to.include(evil)
    })

    it('treats values as data: backticks and spaces survive verbatim', function () {
      const sentinel = path.join(tmp, 'PWNED_ZSH_BACKTICK')
      const backtick = `evil\`touch ${sentinel}\`app`
      const values = [backtick, 'has space value']
      const reply = runZshHelper(zshPath, values)
      expect(existsSync(sentinel), 'backtick substitution must not have run').to.be.false
      for (const v of values) expect(reply, `value should survive verbatim: ${v}`).to.include(v)
    })
  })

  /** Source the generated bash script, set the completion state, invoke it. */
  function runBash(compWords: string[], cword: number, suggestLines: string[]): string[] {
    const words = compWords.map(s => sq(s)).join(' ')
    const script = `
heroku() {
  if [[ "$1" == "autocomplete:__suggest" && "$2" == "--flag" ]]; then
    printf '%s\\n' ${suggestLines.map(s => sq(s)).join(' ')}
  fi
}
source ${sq(bashPath)}
COMP_WORDS=(${words})
COMP_CWORD=${cword}
_heroku_autocomplete
printf '%s\\n' "\${COMPREPLY[@]}"
`
    return execLines('bash', ['-c', script])
  }
})

/** Eval the real injected helper from the generated zsh file, capturing compadd. */
function runZshHelper(file: string, suggestLines: string[]): string[] {
  const src = readFileSync(file, 'utf8')
  const helper = src.match(/_heroku_complete_app \(\) \{[\S\s]*?\n {2}}/)?.[0]
  expect(helper, 'generated zsh must contain the injected helper').to.be.a('string')
  const script = `
emulate -L zsh
heroku() { printf '%s\\n' ${suggestLines.map(s => sq(s)).join(' ')} }
compadd() { [[ "$1" == "-a" ]] && print -l -- "\${(P)2[@]}" }
${helper}
_heroku_complete_app
`
  return execLines('zsh', ['-fc', script])
}

function execLines(bin: string, args: string[]): string[] {
  return execFileSync(bin, args, {encoding: 'utf8'})
    .split('\n')
    .filter(line => line.length > 0)
}

function hasShell(bin: string): boolean {
  try {
    execFileSync(bin, ['--version'], {stdio: 'ignore'})
    return true
  } catch {
    return false
  }
}

/** POSIX single-quote escaping for safe embedding in a shell script. */
function sq(s: string): string {
  return `'${s.replaceAll("'", String.raw`'\''`)}'`
}
