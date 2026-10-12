import type {Interfaces} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {completionsByFlag} from './completions.js'

/** Short-char aliases per flag, so bash matches `-a` as well as `--app`. */
const SHORT_FLAG_CHARS: {[flag: string]: string[]} = {
  app: ['a'],
}

/**
 * Patch the plugin-generated completion scripts so that flag VALUES complete
 * dynamically. Runs from a `postrun` hook right after the generator finishes.
 *
 * The `@oclif/plugin-autocomplete` colon-separator generators only ever complete
 * command and flag NAMES — their bash/zsh scripts never read `flag.options`, so
 * there is no built-in path for value completion. The plugin internals aren't
 * importable, so instead of forking it we post-process the files it writes to
 * the cache: for every flag with a registered `Completion`, we wire the value
 * position to shell out to `<bin> autocomplete:__suggest --flag <name>`.
 *
 * Protocol (frozen — see src/commands/autocomplete/__suggest.ts): the generated
 * scripts always pass the flag's canonical (long) name explicitly via `--flag`.
 * Because the shell already knows which flag's value it is completing, __suggest
 * never re-parses the command line. That is what keeps the bash path immune to
 * the `:`/`=` word-splitting COMP_WORDBREAKS performs on `apps:info --app=`.
 */
export async function injectDynamicCompletions(config: Interfaces.Config): Promise<void> {
  const dynamicFlags = Object.keys(completionsByFlag)
  if (dynamicFlags.length === 0) return

  const {bin} = config
  const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
  const zshPath = path.join(functionsDir, 'zsh', `_${bin}`)
  const bashPath = path.join(functionsDir, 'bash', `${bin}.bash`)

  await Promise.all([
    patchFile(zshPath, src => patchZsh(src, bin, dynamicFlags)),
    patchFile(bashPath, src => patchBash(src, bin, dynamicFlags)),
  ])
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

/** The shell helper/function name that fetches live values for one flag. */
function helperName(bin: string, flag: string): string {
  return `_${bin}_complete_${flag}`
}

/**
 * zsh: each option flag is emitted as an `_arguments` spec ending in a bare `:`
 * (empty action), e.g. `"--app=-[app to run command against]:"`. For every
 * dynamic flag we (1) define a helper that shells out to __suggest and (2) point
 * that flag's value position at the helper via the canonical `:message:_fn`
 * action form.
 */
export function patchZsh(src: string, bin: string, dynamicFlags: string[]): string {
  let out = src

  // 1. define one helper per dynamic flag, right after the main function opens.
  const helpers = dynamicFlags
    .filter(flag => !out.includes(helperName(bin, flag)))
    .map(flag => zshHelper(bin, flag))
    .join('')
  if (helpers) out = out.replace(`_${bin} () {\n`, `_${bin} () {\n${helpers}`)

  // 2. point each dynamic flag's value position at its helper.
  for (const flag of dynamicFlags) {
    out = out.replace(valueSpecRegExp(flag), `$1:${flag}:${helperName(bin, flag)}"`)
  }

  return out
}

function zshHelper(bin: string, flag: string): string {
  return [
    '',
    `  ${helperName(bin, flag)} () {`,
    '    local -a _dyn',
    `    _dyn=(\${(f)"$(${bin} autocomplete:__suggest --flag ${flag} 2>/dev/null)"})`,
    // eslint-disable-next-line no-template-curly-in-string -- literal zsh parameter expansion
    '    [[ ${#_dyn} -gt 0 ]] && compadd -a _dyn',
    '  }',
    '',
  ].join('\n')
}

/**
 * Match a flag's zsh value spec, e.g. `"--app=-[app to run command against]:"`
 * (an optional leading `*` marks a `multiple` flag). The description class
 * tolerates escaped brackets (`\]`) so a `]` inside the text can't end the match
 * early, and `flag` is escaped because it is interpolated into the pattern.
 */
function valueSpecRegExp(flag: string): RegExp {
  const f = escapeRegExp(flag)
  return new RegExp(String.raw`("(?:\*)?--${f}=-\[(?:\\.|[^\]])*\]):"`, 'g')
}

function escapeRegExp(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

/**
 * bash: the generated `_<bin>_autocomplete` only completes command/flag names.
 * We inject a prologue right after its first `COMPREPLY=()` that, when the token
 * before the cursor is a dynamic flag (or its `=`), shells out to __suggest and
 * returns those values.
 *
 * The flag is read from `$__prev` (the word before the cursor), which is
 * colon-safe: flag tokens never contain `:` or `=`, so COMP_WORDBREAKS splitting
 * the command id (`apps:info` -> `apps : info`) is irrelevant. Values are read
 * line-by-line into COMPREPLY — never through `compgen -W` — so a value
 * containing shell metacharacters cannot be word-split, globbed, or run as a
 * command substitution. `compopt +o default` suppresses filename fallback so an
 * empty result shows nothing rather than offering local files.
 */
export function patchBash(src: string, bin: string, dynamicFlags: string[]): string {
  const open = bashMarker(bin, '>>>')
  if (src.includes(open)) return src

  const branches = dynamicFlags
    .map(flag => {
      const patterns = [`--${flag}`, ...(SHORT_FLAG_CHARS[flag] ?? []).map(c => `-${c}`)].join('|')
      return `    ${patterns}) __flag=${flag} ;;`
    })
    .join('\n')

  const prologue = `
  ${open}
  local __prev="\${COMP_WORDS[COMP_CWORD-1]}" __flag=""
  if [[ "$__prev" == "=" ]]; then __prev="\${COMP_WORDS[COMP_CWORD-2]}"; fi
  case "$__prev" in
${branches}
  esac
  if [[ -n "$__flag" ]]; then
    # When the line ends at the flag's '=', bash's current word is "=" itself
    # (not ""), so strip a leading '=' to recover the real value prefix.
    local __dyn __line __cur="\${cur#=}"
    __dyn=$(${bin} autocomplete:__suggest --flag "$__flag" 2>/dev/null)
    while IFS= read -r __line; do
      [[ -z "$__line" ]] && continue
      [[ "$__line" == "$__cur"* ]] && COMPREPLY+=("$__line")
    done <<< "$__dyn"
    compopt +o default 2>/dev/null
    return 0
  fi
  ${bashMarker(bin, '<<<')}
`

  // Insert right after the first `COMPREPLY=()` so it short-circuits name completion.
  return src.replace(/\n(\s*)COMPREPLY=\(\)\n/, `\n$1COMPREPLY=()\n${prologue}`)
}

function bashMarker(bin: string, fence: string): string {
  return `# ${fence} ${bin} dynamic value completion`
}
