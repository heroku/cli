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
 * One positional argument wired to a dynamic completion: the command whose arg
 * it is, the arg's 1-based position among that command's positionals, and the
 * catalog id its values come from. Unlike flags — wired globally by long name —
 * positionals are dispatched inside a per-command `case $_command_id` arm, so a
 * binding is scoped to exactly the command it was collected from.
 */
interface ArgBinding {
  commandId: string
  id: string
  position: number
}

async function mapConcurrent<T, R>(items: readonly T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({length: items.length})
  let nextIndex = 0
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++
      // Each worker handles its next item only after the previous load settles.
      // eslint-disable-next-line no-await-in-loop
      results[index] = await mapper(items[index])
    }
  }))
  return results
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
// `--app`/`--team`/`--pipeline` factory flags, `--remote` (`flags.remote()` is a
// bare git-remote flag with no completion metadata, used across ~15 commands),
// the `--dyno`/`--dyno-name` flags (logs and ps:* — the long name is always a
// dyno, so wiring by name is unambiguous; the VALUE is app-scoped, see
// appScopedIds), and a handful of static-enum flags that declare `options:` but
// no `completion:`. Each enum name below is used by exactly one visible command,
// so a global-by-name binding offers that flag's own value set and nothing else.
const idByFlagName: {[name: string]: string} = {
  app: 'app',
  dyno: 'dyno',
  'dyno-name': 'dyno',
  'enforcement-action': 'enforcementaction',
  generation: 'generation',
  network: 'pgnetwork',
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

// Completion ids whose values belong to one specific app. Their generated
// helpers forward the current `--app` value to __suggest (zsh reads it from
// `$opt_args`; bash scans `COMP_WORDS`) so the completion lists that app's
// resources rather than nothing. The flags carrying these ids always sit on a
// command with a required `--app`, so the value is on the line to extract.
const appScopedIds = new Set(['addon', 'configvar', 'dyno', 'release'])

export function resolveCompletionId(longName: string, completion: unknown): string | undefined {
  if (ambiguousFlagNames.has(longName)) return undefined
  const byRef = completion ? idByExternalCompletion.get(completion) : undefined
  const id = byRef ?? idByFlagName[longName]
  return id !== undefined && Object.hasOwn(completionCatalog, id) ? id : undefined
}

// Positional-arg completion is resolved by the arg's NAME. Because positionals
// are dispatched per command (see ArgBinding), an arg name that means different
// things on different commands is handled by excluding the commands where this
// generic mapping would mislead (excludedArgBindings), rather than by refusing
// to wire the name everywhere the way ambiguousFlagNames does for flags.
const idByArgName: {[name: string]: string} = {
  addon: 'addon',
  addon_name: 'addon',
  addonName: 'addon',
  app: 'app',
  attachment_name: 'addon',
  dyno: 'dyno',
  pipeline: 'pipeline',
  release: 'release',
  space: 'space',
}

// `${commandId}\0${argName}` pairs where the generic idByArgName mapping would be
// wrong: the positional names a resource to CREATE (so completing existing names
// is misleading), or it reuses a resource name for something unrelated (the
// addon-service admin commands take an addon *service* in their `addon` arg, not
// one of the app's add-ons).
const excludedArgBindings = new Set([
  'addon-service-capabilities\0addon',
  'addon-service-capabilities:create\0addon',
  'addon-service-capabilities:destroy\0addon',
  'apps:create\0app',
  'spaces:create\0space',
])

// Config vars are app-scoped and only make sense on the `config:*` readers. Wire
// them by explicit (command, arg) because the `key`/`KEY` arg name is otherwise
// an SSH key (`keys:*`) or a certificate file path (`certs:*`) — mapping it by
// name alone would offer config vars for those unrelated args.
const configVarArgs = new Map<string, string>([
  ['config:edit', 'key'],
  ['config:get', 'KEY'],
])

export function resolveArgCompletionId(commandId: string, argName: string): string | undefined {
  const id = configVarArgs.get(commandId) === argName
    ? 'configvar'
    : (excludedArgBindings.has(`${commandId}\0${argName}`) ? undefined : idByArgName[argName])
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
  const perCommand = await mapConcurrent(config.commands, 4, async loadable => {
    const found: CompletionBinding[] = []
    let command
    try {
      command = await loadable.load()
    } catch {
      return found // a command that won't load can't contribute a binding
    }

    const flags = (command.flags ?? {}) as Record<string, {completion?: unknown; hidden?: boolean; type?: string}>
    for (const [longName, flag] of Object.entries(flags)) {
      if (flag?.type !== 'option' || flag.hidden) continue
      const id = resolveCompletionId(longName, flag.completion)
      if (id) found.push({id, longName})
    }

    return found
  })

  const byLongName = new Map<string, string>()
  for (const bindings of perCommand) {
    for (const {id, longName} of bindings) {
      if (!byLongName.has(longName)) byLongName.set(longName, id)
    }
  }

  return [...byLongName].map(([longName, id]) => ({id, longName}))
}

/**
 * Walk every command and collect the positional args that should complete
 * dynamically (zsh only — see patchZsh). Loads each command in parallel (a
 * command that fails to load is skipped), reads its live `args`, and resolves
 * each by arg name. Hidden commands and hidden args contribute nothing. The
 * position is the arg's 1-based ordinal among the command's declared args
 * (counted over all of them, so a hidden arg still occupies its slot).
 */
async function collectArgBindings(config: Interfaces.Config): Promise<ArgBinding[]> {
  const perCommand = await mapConcurrent(config.commands, 4, async loadable => {
    const found: ArgBinding[] = []
    let command
    try {
      command = await loadable.load()
    } catch {
      return found
    }

    if (command.hidden) return found

    const args = Object.entries((command.args ?? {}) as Record<string, undefined | {hidden?: boolean}>)
    for (const [index, [argName, arg]] of args.entries()) {
      if (!arg || arg.hidden) continue
      const id = resolveArgCompletionId(command.id, argName)
      if (id) found.push({commandId: command.id, id, position: index + 1})
    }

    return found
  })

  return perCommand.flat()
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
  const [bindings, argBindings] = await Promise.all([collectBindings(config), collectArgBindings(config)])
  if (bindings.length === 0 && argBindings.length === 0) return

  const {bin} = config
  const functionsDir = path.join(config.cacheDir, 'autocomplete', 'functions')
  const zshPath = path.join(functionsDir, 'zsh', `_${bin}`)
  const bashPath = path.join(functionsDir, 'bash', `${bin}.bash`)

  await Promise.all([
    // Positional-arg value completion is zsh-only for now: zsh's `_arguments`
    // tracks flag/positional interleaving and the current positional index for
    // free, where the bash generator has no positional machinery to hook. Flag
    // value completion covers both shells.
    patchFile(zshPath, src => patchZsh(src, bin, bindings, argBindings)),
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
export function patchZsh(src: string, bin: string, bindings: CompletionBinding[], argBindings: ArgBinding[] = []): string {
  let out = src

  // 1. define one helper per distinct completion id used by a flag OR a
  //    positional, right after the main function opens.
  const ids = [...new Set([...argBindings.map(binding => binding.id), ...bindings.map(binding => binding.id)])]
  const helpers = ids
    .filter(id => !out.includes(`${helperName(bin, id)} ()`))
    .map(id => zshHelper(bin, id))
    .join('')
  if (helpers) out = out.replace(`_${bin} () {\n`, match => `${match}${helpers}`)

  // 2. point each bound flag's value position at its id's helper.
  for (const {id, longName} of bindings) {
    out = out.replace(valueSpecRegExp(longName), (_match, prefix: string) => `${prefix}:${id}:${helperName(bin, id)}"`)
  }

  // 3. add a positional spec to each bound command's flag array, then route
  //    positional completion through `_arguments` so those specs are consulted.
  for (const binding of argBindings) {
    out = injectArgSpec(out, bin, binding)
  }

  if (argBindings.length > 0) out = patchZshArgDispatch(out)

  return out
}

/**
 * Add one positional spec to a command's `_command_flags` array in its
 * `_set_flags` case arm. The plugin numbers positionals through `_arguments`
 * with the command id itself as positional 1 (`'1: :_complete_commands'`), so a
 * command's first real arg is positional 2 — hence `position + 1`. If the arm
 * isn't found (an unexpected generator change) the binding is silently dropped,
 * matching how flag bindings degrade.
 */
function injectArgSpec(src: string, bin: string, {commandId, id, position}: ArgBinding): string {
  const spec = `    "${position + 1}:${id}:${helperName(bin, id)}"\n`
  const arm = new RegExp(String.raw`(\n${escapeRegExp(commandId)}\)\n  _command_flags=\(\n)`)
  return src.replace(arm, match => `${match}${spec}`)
}

/**
 * Route positional completion through `_arguments`. The plugin only populates
 * `_command_flags` (and so consults our positional specs) when completing a
 * flag, and otherwise falls straight to `_path_files`; we always populate it and
 * let `_arguments` decide flag-vs-positional. `_arguments` alone tracks the
 * current positional index across interspersed flags (`--app foo <TAB>`) and
 * populates `$opt_args`, which the app-scoped helpers read — so the exact same
 * helpers serve flag values and positionals. A trailing catch-all keeps file
 * completion for any positional we do not complete.
 */
function patchZshArgDispatch(src: string): string {
  const out = src.replace(
    /if \[\[ "\$_cur" == -\* \]\]; then\s+_set_flags\s+else\s+_path_files\s+fi/,
    '_set_flags',
  )
  return out.replace(
    /(_arguments -S '1: :_complete_commands' \\\s*\$_command_flags)/,
    "$1 \\\n                '*:file:_path_files'",
  )
}

function zshHelper(bin: string, id: string): string {
  // App-scoped ids forward the app `_arguments` already parsed into $opt_args
  // (falling back to the `-a` form). An absent --app expands to "", which
  // __suggest treats as no app context.
  // eslint-disable-next-line no-template-curly-in-string -- literal zsh parameter expansion
  const appArg = appScopedIds.has(id) ? ' --app "${opt_args[--app]:-$opt_args[-a]}"' : ''
  return [
    '',
    `  ${helperName(bin, id)} () {`,
    '    local -a _dyn',
    `    _dyn=(\${(f)"$(${bin} autocomplete:__suggest --flag ${id}${appArg} 2>/dev/null)"})`,
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

  // App-scoped ids (dyno names) also mark `__appscoped=1` so the prologue knows
  // to find and forward the line's --app value.
  const branches = [...longNamesById]
    .map(([id, patterns]) => `    ${patterns.join('|')}) __flag=${id}${appScopedIds.has(id) ? '; __appscoped=1' : ''} ;;`)
    .join('\n')

  const prologue = `
  ${open}
  local __prev="\${COMP_WORDS[COMP_CWORD-1]}" __flag="" __appscoped=""
  if [[ "$__prev" == "=" ]]; then __prev="\${COMP_WORDS[COMP_CWORD-2]}"; fi
  case "$__prev" in
${branches}
  esac
  if [[ -n "$__flag" ]]; then
    # When the line ends at the flag's '=', bash's current word is "=" itself
    # (not ""), so strip a leading '=' to recover the real value prefix.
    local __dyn __line __cur="\${cur#=}" __appargs=()
    if [[ -n "$__appscoped" ]]; then
      # Scan the line for --app <v> / --app=<v> / -a <v> (COMP_WORDBREAKS may put
      # the '=' in its own word). Ignore a following flag so '--app --dyno' is not
      # misread as app '--dyno'. An absent app leaves __appargs empty.
      local __aw="" __av="" __ai=0
      for ((__ai=0; __ai<\${#COMP_WORDS[@]}; __ai++)); do
        __aw="\${COMP_WORDS[__ai]}"
        if [[ "$__aw" == --app=* ]]; then
          __appargs=(--app "\${__aw#--app=}")
        elif [[ "$__aw" == "--app" || "$__aw" == "-a" ]]; then
          __av="\${COMP_WORDS[__ai+1]}"
          [[ "$__av" == "=" ]] && __av="\${COMP_WORDS[__ai+2]}"
          [[ -n "$__av" && "$__av" != -* ]] && __appargs=(--app "$__av")
        fi
      done
    fi
    __dyn=$(${bin} autocomplete:__suggest --flag "$__flag" "\${__appargs[@]}" 2>/dev/null)
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
  return src.replace(/\n(\s*)COMPREPLY=\(\)\n/, (_match, indent: string) => `\n${indent}COMPREPLY=()\n${prologue}`)
}

function bashMarker(bin: string, fence: string): string {
  return `# ${fence} ${bin} dynamic value completion`
}
