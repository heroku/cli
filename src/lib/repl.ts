/* eslint-disable n/no-process-exit */
import {hux} from '@heroku/heroku-cli-util'
import {Config, run} from '@oclif/core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
// do not use the older node:readline module
// else things will break
import * as readline from 'node:readline/promises'
import util from 'node:util'
import * as shellQuote from 'shell-quote'
import yargs from 'yargs-parser'

const historyFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_history')
const stateFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_state')

const maxHistory = 1000
const mcpMode = process.env.HEROKU_MCP_MODE === 'true'
/**
 * Map of commands used to provide completion
 * data. The key is the flag or arg name to
 * get data for and the value is an array containing
 * the command name and an array of arguments to
 * pass to the command if needed.
 *
 * @example
 * heroku > pipelines:create --app <tab><tab>
 * heroku > spaces:create --team <tab><tab>
 */
const completionCommandByName = new Map([
  ['addon', ['addons', ['--json']]],
  ['app', ['apps', ['--all', '--json']]],
  ['domain', ['domains', ['--json']]],
  ['dyno', ['ps', ['--json']]],
  ['org', ['orgs', ['--json']]],
  ['pipeline', ['pipelines', ['--json']]],
  ['release', ['releases', ['--json']]],
  ['space', ['spaces', ['--json']]],
  ['stack', ['apps:stacks', ['--json']]],
  ['team', ['teams', ['--json']]],
])

/**
 * Map of completion data by flag or arg name.
 * This is used as a cache for completion data
 * that is retrieved from a remote source.
 *
 * No attempt is made to invalidate these caches
 * at runtime but they are not preserved between
 * sessions.
 */
const completionResultsByName = new Map()

export class HerokuRepl {
  /**
   * The OClif config object containing
   * the command metadata and the means
   * to execute commands
   */
  private config: Config

  /**
   * The history of the REPL commands used
   */
  private history: string[] = []

  /**
   * The write stream for the history file
   */
  private historyStream: fs.WriteStream | undefined

  /**
   * Processes the line received from the terminal stdin
   *
   * @param {string} input the line to process
   * @returns {Promise<void>} a promise that resolves when the command has been executed
   */
  private processLine = async (input: string): Promise<void> => {
    if (input.trim() === '') {
      this.rl.prompt()
      return
    }

    this.history.push(input)
    this.historyStream?.write(input + '\n')

    const tokens = shellQuote.parse(input)
    const stringTokens = tokens.filter((t): t is string => typeof t === 'string')
    // flag/arg extraction
    const {_: [command, ...positionalArgs], ...flags} = yargs(stringTokens, {
      configuration: {
        'boolean-negation': false,
        'camel-case-expansion': false,
      },
    })
    const args: string[] = Object.entries(flags).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return [`--${key}`, value]
      }

      return [`--${key}`]
    }).concat(positionalArgs.map(String))

    if (command === 'exit') {
      // eslint-disable-next-line n/no-process-exit
      process.exit(0)
    }

    if (command === 'history') {
      process.stdout.write(this.history.join('\n'))
      this.rl.prompt()
      return
    }

    if (command === 'set' || command === 'unset') {
      this.updateFlagsByName(command, args, false)
      this.rl.prompt()
      return
    }

    const cmd = this.config.findCommand(String(command))

    if (!cmd) {
      console.error(`"${command}" is not a valid command`)
      this.rl.prompt()
      return
    }

    try {
      const {flags} = cmd
      for (const [key, value] of this.setValues) {
        if (Reflect.has(flags, key)) {
          args.push(`--${key}`, value)
        }
      }

      // Any commands that prompt the user will cause
      // the REPL to enter an invalid state. We need
      // to pause the readline interface and restore
      // it when the command is done.
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }

      this.rl.close()
      this.rl.off('line', this.processLine)
      if (mcpMode) {
        process.stdout.write('<<<BEGIN RESULTS>>>\n')
      }

      process.argv.length = 2
      process.argv.push(String(command), ...args.filter(Boolean))
      await run([String(command), ...args.filter(Boolean)], this.config)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (mcpMode) {
        process.stderr.write(`<<<ERROR>>>\n${errorMessage}\n<<<END ERROR>>>\n`)
      } else {
        console.error(errorMessage)
      }
    } finally {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
      }

      if (mcpMode) {
        process.stdout.write('<<<END RESULTS>>>\n')
      }

      this.createInterface()
      this.start()
      // Force readline to refresh the current line
      this.rl.write(null, {ctrl: true, name: 'u'})
    }
  }

  /**
   * The readline interface used for the REPL
   */
  private rl!: readline.Interface

  /**
   * A map of key/value pairs used for
   * the 'set' and 'unset' command
   */
  private setValues = new Map<string, string>()

  /**
   * Constructs a new instance of the HerokuRepl class.
   *
   * @param {Config} config The oclif core config object
   */
  constructor(config: Config) {
    this.createInterface()
    this.config = config
  }

  /**
   * Starts the REPL by showing the prompt.
   *
   * @returns {void}
   */
  start() {
    this.rl.prompt()
  }

  /**
   * Wrapper methods for file system operations to enable testing
   */
  protected fsExistsSync(path: string): boolean {
    return fs.existsSync(path)
  }

  protected fsReadFileSync(path: string, encoding: BufferEncoding): string {
    return fs.readFileSync(path, encoding)
  }

  protected fsWriteFileSync(path: string, data: string): void {
    fs.writeFileSync(path, data, 'utf8')
  }

  protected fsCreateWriteStream(path: string, options: any): fs.WriteStream {
    return fs.createWriteStream(path, options)
  }

  /**
   * Build completions for a command.
   * The completions are based on the
   * metadata for the command and the
   * user input.
   *
   * @param {Record<string, unknown>} commandMeta the metadata for the command
   * @param {string[]} flagsOrArgs the flags or args for the command
   * @param {string} line the current line
   * @returns {Promise<[string[], string]>} the completions and the current input
   */
  private async buildCompletions(commandMeta: any, flagsOrArgs: string[] = [], line = ''): Promise<[string[], string]> {
    const {args, flags} = commandMeta
    const {optionalInputs: optionalFlags, requiredInputs: requiredFlags} = this.collectInputsFromManifest(flags)
    const {optionalInputs: optionalArgs, requiredInputs: requiredArgs} = this.collectInputsFromManifest(args)

    const {_: userArgs, ...userFlags} = yargs(flagsOrArgs, {
      configuration: {
        'boolean-negation': false,
        'camel-case-expansion': false,
      },
    })
    const userArgsStrings = Array.isArray(userArgs) ? userArgs.map(String) : []
    // eslint-disable-next-line unicorn/prefer-at
    const current = flagsOrArgs[flagsOrArgs.length - 1] ?? ''

    // Order of precedence:
    // 1. Required flags
    // 2. Required args
    // 3. Optional flags
    // 4. Optional args
    // 5. End of line
    // Flags *must* occur first since they may influence
    // the completions for args.
    return await this.getCompletionsForFlag(line, current, requiredFlags, userFlags, commandMeta)
      || await this.getCompletionsForArg(current, requiredArgs, userArgsStrings)
      || await this.getCompletionsForFlag(line, current, optionalFlags, userFlags, commandMeta)
      || await this.getCompletionsForArg(current, optionalArgs, userArgsStrings)
      || this.getCompletionsForEndOfLine(line, flags, userFlags)
  }

  /**
   * Get completions for a command.
   * The completions are based on the
   * metadata for the command and the
   * user input.
   *
   * @param {[string, string]} parts the parts for a line to get completions for
   * @returns {[string[], string]} the completions and the current input
   */
  private async buildSetCompletions(parts: string[]): Promise<[string[], string]> {
    const [name, current] = parts
    if (parts.length > 0 && completionCommandByName.has(name)) {
      return [await this.getCompletion(name, current), current]
    }

    // Critical to completions operating as expected;
    // the completions must be filtered to omit keys
    // that do not match our name (if a name exists).
    const completions = [...completionCommandByName.keys()]
      .filter(c => !name || c.startsWith(name))

    return [completions, name ?? current]
  }

  /**
   * Capture stdout by deflecting it to a
   * trap function and returning the output.
   *
   * This is useful for silently capturing the output
   * of a command that normally prints to stdout.
   *
   * @param {CallableFunction} fn the function to capture stdout for
   * @returns {Promise<string>} the output from stdout
   */
  private async captureStdout(fn: () => Promise<void>): Promise<string> {
    const output: string[] = []
    const originalWrite = process.stdout.write
    // Replace stdout.write temporarily
    process.stdout.write = chunk => {
      output.push(typeof chunk === 'string' ? chunk : chunk.toString())
      return true
    }

    try {
      await fn()
      return output.join('')
    } finally {
      // Restore original stdout
      process.stdout.write = originalWrite
    }
  }

  /**
   * Collect inputs from the command manifest and sorts
   * them by type and then by required status.
   *
   * @param {Record<string, unknown>} commandMeta the metadata from the command manifest
   * @returns {{requiredInputs: {long: string, short: string}[], optionalInputs: {long: string, short: string}[]}} the inputs from the command manifest
   */
  private collectInputsFromManifest(commandMeta: any): {requiredInputs: Array<{long: string; short: string}>; optionalInputs: Array<{long: string; short: string}>} {
    const requiredInputs: Array<{long: string; short: string}> = []
    const optionalInputs: Array<{long: string; short: string}> = []

    // Prioritize options over booleans
    const keysByType = Object.keys(commandMeta).sort((a, b) => {
      const {type: aType} = commandMeta[a]
      const {type: bType} = commandMeta[b]
      if (aType === bType) {
        return 0
      }

      if (aType === 'option') {
        return -1
      }

      if (bType === 'option') {
        return 1
      }

      return 0
    })
    const includedFlags = new Set()
    for (const key of keysByType) {
      const {char: short, name: long, required: isRequired} = commandMeta[key]
      if (includedFlags.has(long)) {
        continue
      }

      includedFlags.add(long)
      if (isRequired) {
        requiredInputs.push({long, short})
        continue
      }

      optionalInputs.push({long, short})
    }

    // Prioritize required inputs
    // over optional inputs
    // required inputs are sorted
    // alphabetically. optional
    // inputs are sorted alphabetically
    // and then pushed to the end of
    // the list.
    requiredInputs.sort((a, b) => {
      if (a.long < b.long) {
        return -1
      }

      if (a.long > b.long) {
        return 1
      }

      return 0
    })

    return {optionalInputs, requiredInputs}
  }

  /**
   * Creates a new readline interface.
   *
   * @returns {readline.Interface} the readline interface
   */
  private createInterface() {
    this.rl = readline.createInterface({
      completer: async (line: string): Promise<[string[], string]> => {
        if (mcpMode) {
          return [[], line]
        }

        // Use shell-quote to tokenize the line for robust parsing
        const tokens = shellQuote.parse(line)
        const stringTokens = tokens.filter((t): t is string => typeof t === 'string')
        const [command = '', ...parts] = stringTokens
        if (command === 'set') {
          return this.buildSetCompletions(parts)
        }

        const commandMeta = this.config.findCommand(command)
        if (!commandMeta) {
          const matches = this.config.commands.filter(({id}: any) => id.startsWith(command))
          return [matches.map(({id}: any) => id).sort(), line]
        }

        return this.buildCompletions(commandMeta, parts, line)
      },
      historySize: maxHistory,
      input: process.stdin,
      output: process.stdout,
      prompt: 'heroku > ',
      removeHistoryDuplicates: true,
    })
    this.prepareHistory()
    this.loadState()

    // @ts-expect-error history exists at runtime but not in types
    this.rl.history.push(...this.history)
    this.rl.on('line', this.processLine)
    this.rl.once('close', () => {
      this.historyStream?.close()
      this.fsWriteFileSync(stateFile, JSON.stringify(Object.fromEntries(this.setValues)))
    })
    this.rl.prompt()
  }

  /**
   * Get completions for a flag.
   *
   * @param {string} flag the flag to get the completion for
   * @param {string} startsWith the string to match against
   * @returns {Promise<[string[]]>} the completions
   */
  private async getCompletion(flag: string, startsWith: string): Promise<string[]> {
    // attempt to retrieve the options from the
    // Heroku API. If the options have already
    // been retrieved, they will be cached.
    if (completionCommandByName.has(flag)) {
      let result: any[] = []
      if (completionResultsByName.has(flag)) {
        result = completionResultsByName.get(flag)
      }

      if (!result || result.length === 0) {
        const [command, args] = completionCommandByName.get(flag)!
        const commandStr = Array.isArray(command) ? command[0] : command
        const argsArray = Array.isArray(args) ? args : [args]
        const completionsStr = await this.captureStdout(() => this.config.runCommand(commandStr, argsArray as any)) ?? '[]'
        result = JSON.parse(util.stripVTControlCharacters(completionsStr))
        completionResultsByName.set(flag, result)
      }

      const matched = result
        .map((obj: any) => obj.name ?? obj.id)
        .filter((name: string) => !startsWith || name.startsWith(startsWith))
        .sort()

      return matched
    }

    return []
  }

  /**
   * Get completions for an arg.
   *
   * @param {string} current the current input
   * @param {({long: string}[])} args the args for the command
   * @param {string[]} userArgs the args that have already been used
   * @returns {Promise<[string[], string] | null>} the completions and the current input
   */
  private async getCompletionsForArg(current: string, args: Array<{long: string}> = [], userArgs: string[] = []): Promise<[string[], string] | null> {
    if (userArgs.length <= args.length) {
      const arg = args[userArgs.length]
      if (arg) {
        const {long} = arg
        if (completionCommandByName.has(long)) {
          const completions = await this.getCompletion(long, current)
          if (completions.length > 0) {
            return [completions, current]
          }
        }

        return [[`<${long}>`], current]
      }
    }

    return null
  }

  /**
   * Get completions for the end of the line.
   *
   * @param {string} line the current line
   * @param {Record<string, unknown>} flags the flags for the command
   * @param {Record<string, unknown>} userFlags the flags that have already been used
   * @returns {[string[], string]} the completions and the current input
   */
  private getCompletionsForEndOfLine(line: string, flags: any, userFlags: any): [string[], string] {
    const flagKeys = Object.keys(userFlags)
    // If there are no more flags to complete,
    // return an empty array.
    return flagKeys.length < Object.keys(flags).length ? [[line.endsWith(' ') ? '--' : ' --'], ''] : [[], '']
  }

  /**
   * Get completions for a flag or flag value.
   *
   * @param {string} line the current line
   * @param {string} current the current input
   * @param {string[]} flags the flags for the command
   * @param {string[]} userFlags the flags that have already been used
   * @param {Record<string, unknown>} commandMeta the metadata for the command
   * @return {Promise<[string[], string]>} the completions and the current input
   */
  private async getCompletionsForFlag(line: string, current: string, flags: any, userFlags: any, commandMeta: any): Promise<[string[], string] | null> {
    const commandMetaWithCharKeys = {...commandMeta}
    // make sure the commandMeta also contains keys for char fields
    Object.keys(commandMeta.flags).forEach(key => {
      const flag = commandMeta.flags[key]
      if (flag.char) {
        commandMetaWithCharKeys.flags[flag.char] = flag
      }
    })
    // flag completion for long and short flags.
    // flags that have already been used are
    // not included in the completions.
    const isFlag = current.startsWith('-')
    const isLongFlag = current.startsWith('--')
    if (isFlag) {
      const rawFlag = isLongFlag ? current.slice(2) : current.slice(1)
      const prop = isLongFlag ? 'long' : 'short'
      const matched = flags
        .filter((flag: any) => !Reflect.has(userFlags, flag.short) && !Reflect.has(userFlags, flag.long)
          && (!rawFlag || flag[prop]?.startsWith(rawFlag)))
        .map((f: any) => isLongFlag ? f.long : f.short)
        .filter(Boolean)

      if (matched?.length > 0) {
        return [matched, rawFlag]
      }
    }

    // Does the flag have a value or is it
    // expected to have a value?
    const flagKeys = Object.keys(userFlags)
    // eslint-disable-next-line unicorn/prefer-at
    const flag = flagKeys[flagKeys.length - 1]
    const isBooleanFlag = commandMetaWithCharKeys.flags[flag]?.type === 'boolean'
    if (this.isFlagValueComplete(line) || isBooleanFlag || current === '--' || current === '-') {
      return null
    }

    const {name, options, type} = commandMetaWithCharKeys.flags[flag] ?? {}
    // Options are defined in the metadata
    // for the command. If the flag has options
    // defined, we will attempt to complete
    // based on the options.
    if (type === 'option') {
      if (options?.length > 0) {
        const optionComplete = options.includes(current)
        const matched = options.filter((o: string) => o.startsWith(current))

        if (!optionComplete) {
          return matched.length > 0 ? [matched, current] : [options, current]
        }
      }

      return [await this.getCompletion(name, isFlag ? '' : current), current]
    }

    return null
  }

  private isFlagValueComplete(input: string): boolean {
    const tokens = shellQuote.parse(input.trim())
    const len = tokens.length
    if (len === 0) {
      return false
    }

    const lastToken = tokens[len - 1]

    // "-" or "--" means the flag name is absent
    if (lastToken === '-' || lastToken === '--') {
      return false
    }

    // back up to the last flag and store the index
    let lastFlagIndex = -1
    for (let i = len - 1; i >= 0; i--) {
      const token = tokens[i]
      if (typeof token === 'string' && token.startsWith('-')) {
        lastFlagIndex = i
        break
      }
    }

    // No flag, nothing to complete
    if (lastFlagIndex === -1) {
      return true
    }

    // If the last flag is the last token
    // e.g., "run hello.sh --app"
    if (lastFlagIndex === len - 1) {
      return false
    }

    // If the last flag has a value
    if (lastFlagIndex === len - 2) {
      // e.g., "run hello.sh --app heroku-vscode "
      // If input ends with whitespace assume the value is complete
      return /\s$/.test(input)
    }

    // If the last flag is followed by more than one value, treat as complete
    // since the last value is likely to be an argument
    return true
  }

  /**
   * Loads the previous session state from the state file.
   * @returns {void}
   */
  private loadState() {
    if (this.fsExistsSync(stateFile)) {
      try {
        const state = JSON.parse(this.fsReadFileSync(stateFile, 'utf8'))
        for (const [key, value] of Object.entries(state)) {
          this.updateFlagsByName('set', [key, String(value)], true)
        }

        process.stdout.write('session restored')
      } catch {
        // noop
      }
    }
  }

  /**
   * Prepares the REPL history by loading
   * the previous history from the history file
   * and opening a write stream for new entries.
   *
   * @returns {Promise<void>} a promise that resolves when the history has been loaded
   */
  private prepareHistory(): void {
    this.historyStream = this.fsCreateWriteStream(historyFile, {
      encoding: 'utf8',
      flags: 'a',
    })

    // Load existing history first
    if (this.fsExistsSync(historyFile)) {
      const lines = this.fsReadFileSync(historyFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .reverse()
      this.history = lines.slice(0, maxHistory)
    }
  }

  /**
   * Updates the session state based on the command and args.
   *
   * @param {'set'|'unset'} command either 'set' or 'unset'
   * @param {string[]} args an array of arg names
   * @param {boolean} omitConfirmation when false. no confirmation is printed to stdout
   * @returns {void}
   */
  private updateFlagsByName(command: 'set' | 'unset', args: string[], omitConfirmation: boolean): void {
    if (command === 'set') {
      const [key, value] = args
      if (key && value) {
        this.setValues.set(key, value)

        if (!omitConfirmation) {
          process.stdout.write(`setting --${key} to ${value}\n`)
        }

        if (key === 'app') {
          this.rl.setPrompt(`${value} > `)
        }
      } else {
        const values = []
        for (const [flag, value] of this.setValues) {
          values.push({flag, value})
        }

        if (values.length === 0) {
          return console.info('no flags set')
        }

        hux.table(values, {
          flag: {header: 'Flag'},
          value: {header: 'Value'},
        })
      }
    }

    if (command === 'unset') {
      const [key] = args

      if (!omitConfirmation) {
        process.stdout.write(`unsetting --${key}\n`)
      }

      this.setValues.delete(key)
      if (key === 'app') {
        this.rl.setPrompt('heroku > ')
      }
    }
  }
}
