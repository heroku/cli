import type {Interfaces} from '@oclif/core'

import * as externalCompletions from '@heroku-cli/command/lib/completions.js'
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {completionCatalog} from './completions.js'

/**
 * One flag position wired to a dynamic completion: the flag's canonical long
 * name (what the generated scripts match on) and the catalog id whose values it
 * completes (what they pass back to `autocomplete:__suggest --flag <id>`).
 */
interface CompletionBinding {
  id: string
  longName: string
}

/**
 * The completion id a flag's values should be drawn from, or `undefined` if the
 * flag has no (implemented) completion.
 *
 * Two signals, in priority order, mirroring the old homegrown resolver:
 *   1. an explicit `completion:` on the flag — matched by reference identity
 *      against the shared `@heroku-cli/command` completion singletons the
 *      commands actually import, so the binding survives a flag being renamed
 *      and a completion id that differs from the long name (`--size` ->
 *      `dynosize`);
 *   2. a fallback by long name for the factory flags that carry no `completion:`
 *      metadata of their own (`--app`, `--team`, `--pipeline`).
 *
 * Only ids present in `completionCatalog` are returned, so a flag pointing at a
 * not-yet-implemented completion is simply skipped rather than wired to nothing.
 */
const idByExternalCompletion = new Map<unknown, string>([
  [externalCompletions.AppCompletion, 'app'],
  [externalCompletions.BuildpackCompletion, 'buildpack'],
  [externalCompletions.DynoSizeCompletion, 'dynosize'],
  [externalCompletions.PipelineCompletion, 'pipeline'],
  [externalCompletions.ProcessTypeCompletion, 'processtype'],
  [externalCompletions.RegionCompletion, 'region'],
  [externalCompletions.RemoteCompletion, 'remote'],
  [externalCompletions.RoleCompletion, 'role'],
  [externalCompletions.ScopeCompletion, 'scope'],
  [externalCompletions.SpaceCompletion, 'space'],
  [externalCompletions.StackCompletion, 'stack'],
  [externalCompletions.StageCompletion, 'stage'],
  [externalCompletions.TeamCompletion, 'team'],
])

// Fallback by long name for flags that carry no `completion:` of their own: the
// `--app`/`--team`/`--pipeline` factory flags, and `--remote` (`flags.remote()`
// is a bare git-remote flag with no completion metadata, used across ~15 commands).
const idByFlagName: {[name: string]: string} = {
  app: 'app',
  pipeline: 'pipeline',
  remote: 'remote',
  team: 'team',
}

// Long names that are overloaded across commands with incompatible value sets.
// The generated scripts wire a flag's values globally by long name (no per-command
// context — see collectBindings), so binding an overloaded name would offer one
// command's values on another. `--type` is a process type on `run`/`ps:wait` but a
// quota enum (`['storage']`) on `pg:quotas:*`; rather than mis-serve either, we
// never wire `--type` and complete the unambiguous `--process-type` instead.
const ambiguousFlagNames = new Set(['type'])

export function resolveCompletionId(longName: string, completion: unknown): string | undefined {
  if (ambiguousFlagNames.has(longName)) return undefined
  const byRef = completion ? idByExternalCompletion.get(completion) : undefined
  const id = byRef ?? idByFlagName[longName]
  return id !== undefined && Object.hasOwn(completionCatalog, id) ? id : undefined
}

/**
 * Walk every command and collect the flags that should complete dynamically.
 *
 * A flag's `completion:` is a function-bearing object, so it is stripped from
 * the serialized manifest — it only exists on the loaded command class. We
 * therefore load each command (in parallel, best-effort: a command that fails to
 * load is skipped, never fatal) and read its live flags. Deduplicate by long
 * name, keeping the first binding in command order so the result is stable.
 *
 * Only long names are wired: the colon-separator generators complete flags
 * globally, with no per-command context, and every short char is reused across
 * commands for unrelated flags (`-s` is `--size`, `--space`, `--stack`, `--scope`
 * ...). A globally-wired short char would therefore offer the wrong values, so
 * short-flag value completion is intentionally left out until the protocol can
 * carry per-command context.
 */
async function collectBindings(config: Interfaces.Config): Promise<CompletionBinding[]> {
  const perCommand = await Promise.all(config.commands.map(async loadable => {
    const found: CompletionBinding[] = []
    let command
    try {
      command = await loadable.load()
    } catch {
      return found // a command that won't load can't contribute a binding
    }

    const flags = (command.flags ?? {}) as Record<string, {completion?: unknown; hidden?: boolean; type?: string}>
    for (const [longName, flag] of Object.entries(flags)) {
      if (!flag || flag.type !== 'option' || flag.hidden) continue
      const id = resolveCompletionId(longName, flag.completion)
      if (id) found.push({id, longName})
    }

    return found
  }))

  const byLongName = new Map<string, string>()
  for (const bindings of perCommand) {
    for (const {id, longName} of bindings) {
      if (!byLongName.has(longName)) byLongName.set(longName, id)
    }
  }

  return [...byLongName].map(([longName, id]) => ({id, longName}))
}

/**
 * Patch the plugin-generated completion scripts so that flag VALUES complete
 * dynamically. Runs from a `postrun` hook right after the generator finishes.
 *
 * The `@oclif/plugin-autocomplete` colon-separator generators only ever complete
 * command and flag NAMES — their bash/zsh scripts never read `flag.options`, so
 * there is no built-in path for value completion. The plugin internals aren't
 * importable, so instead of forking it we post-process the files it writes to
 * the cache: for every flag bound to a `Completion`, we wire the value position
 * to shell out to `<bin> autocomplete:__suggest --flag <completion-id>`.
 *
 * Protocol (frozen — see src/commands/autocomplete/__suggest.ts): the generated
 * scripts always pass the completion id explicitly via `--flag`. Because the
 * shell already knows which flag's value it is completing, __suggest never
 * re-parses the command line. That is what keeps the bash path immune to the
 * `:`/`=` word-splitting COMP_WORDBREAKS performs on `apps:info --app=`.
 */
export async function injectDynamicCompletions(config: Interfaces.Config): Promise<void> {
  const bindings = await collectBindings(config)
  if (bindings.length === 0) return

  const {bin} = config
  const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
  const zshPath = path.join(functionsDir, 'zsh', `_${bin}`)
  const bashPath = path.join(functionsDir, 'bash', `${bin}.bash`)

  await Promise.all([
    patchFile(zshPath, src => patchZsh(src, bin, bindings)),
    patchFile(bashPath, src => patchBash(src, bin, bindings)),
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

/** The shell helper/function name that fetches live values for one completion id. */
function helperName(bin: string, id: string): string {
  return `_${bin}_complete_${id}`
}

/**
 * zsh: each option flag is emitted as an `_arguments` spec ending in a bare `:`
 * (empty action), e.g. `"--app=-[app to run command against]:"`. For every bound
 * flag we (1) define a helper per completion id that shells out to __suggest and
 * (2) point that flag's value position at the helper via the canonical
 * `:message:_fn` action form.
 */
export function patchZsh(src: string, bin: string, bindings: CompletionBinding[]): string {
  let out = src

  // 1. define one helper per distinct completion id, right after the main
  //    function opens.
  const ids = [...new Set(bindings.map(binding => binding.id))]
  const helpers = ids
    .filter(id => !out.includes(`${helperName(bin, id)} ()`))
    .map(id => zshHelper(bin, id))
    .join('')
  if (helpers) out = out.replace(`_${bin} () {\n`, `_${bin} () {\n${helpers}`)

  // 2. point each bound flag's value position at its id's helper.
  for (const {id, longName} of bindings) {
    out = out.replace(valueSpecRegExp(longName), `$1:${id}:${helperName(bin, id)}"`)
  }

  return out
}

function zshHelper(bin: string, id: string): string {
  return [
    '',
    `  ${helperName(bin, id)} () {`,
    '    local -a _dyn',
    `    _dyn=(\${(f)"$(${bin} autocomplete:__suggest --flag ${id} 2>/dev/null)"})`,
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
 * early, and `longName` is escaped because it is interpolated into the pattern.
 */
function valueSpecRegExp(longName: string): RegExp {
  const f = escapeRegExp(longName)
  return new RegExp(String.raw`("(?:\*)?--${f}=-\[(?:\\.|[^\]])*\]):"`, 'g')
}

function escapeRegExp(s: string): string {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

/**
 * bash: the generated `_<bin>_autocomplete` only completes command/flag names.
 * We inject a prologue right after its first `COMPREPLY=()` that, when the token
 * before the cursor is a bound flag (or its `=`), shells out to __suggest and
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
export function patchBash(src: string, bin: string, bindings: CompletionBinding[]): string {
  const open = bashMarker(bin, '>>>')
  if (src.includes(open)) return src

  // Group long names by id so flags sharing a completion collapse to one branch.
  const longNamesById = new Map<string, string[]>()
  for (const {id, longName} of bindings) {
    const names = longNamesById.get(id) ?? []
    names.push(`--${longName}`)
    longNamesById.set(id, names)
  }

  const branches = [...longNamesById]
    .map(([id, patterns]) => `    ${patterns.join('|')}) __flag=${id} ;;`)
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
