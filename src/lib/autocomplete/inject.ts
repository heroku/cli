import type {Interfaces} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {CompletionMapping} from './completions.js'

/**
 * SPIKE 2 (Option A): patch the plugin-generated completion scripts so that
 * flag VALUES are completed dynamically.
 *
 * The @oclif/plugin-autocomplete LEGACY (colon-separator) generators only ever
 * complete command and flag NAMES — their bash/zsh scripts never read
 * `flag.options`, so there is no built-in path for value completion. Rather than
 * fork the plugin (its internals aren't importable), we post-process the files
 * it writes to the cache: for every flag that has a registered `Completion`, we
 * wire the value position to shell out to `<bin> autocomplete:__suggest "<line>"`.
 *
 * This runs from a `postrun` hook right after the generator command finishes.
 */

/** Flag names whose values should complete dynamically (from the catalog). */
function dynamicFlags(): string[] {
  return Object.keys(CompletionMapping)
}

/**
 * Short-char aliases per flag, used to match `-a` as well as `--app` in bash.
 * For the spike, apps consistently expose `-a`; Phase 3 should derive these
 * from the command metadata instead of hard-coding.
 */
const FLAG_CHARS: {[flag: string]: string[]} = {
  app: ['a'],
}

export async function injectDynamicCompletions(config: Interfaces.Config): Promise<void> {
  const flags = dynamicFlags()
  if (flags.length === 0) return

  const {bin} = config
  const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
  const zshPath = path.join(functionsDir, 'zsh', `_${bin}`)
  const bashPath = path.join(functionsDir, 'bash', `${bin}.bash`)

  await Promise.all([patchFile(zshPath, src => patchZsh(src, bin, flags)), patchFile(bashPath, src => patchBash(src, bin, flags))])
}

async function patchFile(file: string, transform: (src: string) => string): Promise<void> {
  let src: string
  try {
    src = await readFile(file, 'utf8')
  } catch {
    return // nothing generated for this shell; skip
  }

  const next = transform(src)
  if (next !== src) await writeFile(file, next)
}

/**
 * zsh: each option flag is emitted as an `_arguments` spec ending in a bare `:`
 * (empty message, no action), e.g. `"--app=-[app to run command against]:"`.
 * We append an action that calls a helper so zsh offers live values.
 */
export function patchZsh(src: string, bin: string, flags: string[]): string {
  const fn = `_${bin}_dynamic_completion`
  let out = src

  // 1. define the helper once, right after the main function opens.
  if (!out.includes(fn)) {
    const helper = [
      '',
      `  ${fn} () {`,
      '    local -a _dyn',
      `    _dyn=(\${(f)"$(${bin} autocomplete:__suggest "\${words[*]}" 2>/dev/null)"})`,
      // eslint-disable-next-line no-template-curly-in-string -- literal zsh parameter expansion
      '    [[ ${#_dyn} -gt 0 ]] && compadd -a _dyn',
      '  }',
      '',
    ].join('\n')
    out = out.replace(`_${bin} () {\n`, `_${bin} () {\n${helper}`)
  }

  // 2. give each dynamic flag's value position an action pointing at the helper.
  for (const flag of flags) {
    const re = new RegExp(`("(?:\\*)?--${flag}=-\\[[^\\]]*\\]):"`, 'g')
    out = out.replace(re, `$1:${flag}:${fn}"`)
  }

  return out
}

/**
 * bash: the generated `_<bin>_autocomplete` only completes command/flag names.
 * We inject a prologue that, when the token before the cursor is a dynamic flag
 * (or its `=`), shells out to `autocomplete:__suggest` and returns those values.
 */
export function patchBash(src: string, bin: string, flags: string[]): string {
  const marker = '# >>> heroku dynamic value completion'
  if (src.includes(marker)) return src

  const patterns = flags
    .flatMap(flag => [`--${flag}`, ...(FLAG_CHARS[flag] ?? []).map(c => `-${c}`)])
    .join('|')

  const prologue = `
  ${marker}
  local __prev="\${COMP_WORDS[COMP_CWORD-1]}"
  if [[ "$__prev" == "=" ]]; then __prev="\${COMP_WORDS[COMP_CWORD-2]}"; fi
  case "$__prev" in
    ${patterns})
      local __dyn
      __dyn=$(${bin} autocomplete:__suggest "\${COMP_WORDS[*]}" 2>/dev/null)
      COMPREPLY=( $(compgen -W "$__dyn" -- "$cur") )
      return 0
      ;;
  esac
  # <<< heroku dynamic value completion
`

  // Insert right after the first `COMPREPLY=()` so it short-circuits name completion.
  return src.replace(/\n(\s*)COMPREPLY=\(\)\n/, `\n$1COMPREPLY=()\n${prologue}`)
}
