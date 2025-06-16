// do not use the older node:readline module
// else things will break
const readline = require('node:readline/promises')
const yargs = require('yargs-parser')
const util = require('util')
const path = require('node:path')
const fs = require('node:fs')
const {ux, run} = require('@oclif/core')
const os = require('node:os')
const historyFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_history')
const stateFile = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.heroku_repl_state')
const shellQuote = require('shell-quote')

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
  ['app', ['apps', ['--all', '--json']]],
  ['org', ['orgs', ['--json']]],
  ['team', ['teams', ['--json']]],
  ['space', ['spaces', ['--json']]],
  ['pipeline', ['pipelines', ['--json']]],
  ['addon', ['addons', ['--json']]],
  ['domain', ['domains', ['--json']]],
  ['dyno', ['ps', ['--json']]],
  ['release', ['releases', ['--json']]],
  ['stack', ['apps:stacks', ['--json']]],
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

class HerokuRepl {
  /**
   * The OClif config object containing
   * the command metadata and the means
   * to execute commands
   */
  #config

  /**
   * A map of key/value pairs used for
   * the 'set' and 'unset' command
   */
  #setValues = new Map()

  /**
   * The history of the REPL commands used
   */
  #history = []

  /**
   * The write stream for the history file
   */
  #historyStream

  /**
   * The readline interface used for the REPL
   */
  #rl

  /**
   * Constructs a new instance of the HerokuRepl class.
   *
   * @param {Config} config The oclif core config object
   */
  constructor(config) {
    this.#createInterface()
    this.#config = config
  }

  /**
   * Prepares the REPL history by loading
   * the previous history from the history file
   * and opening a write stream for new entries.
   *
   * @returns {Promise<void>} a promise that resolves when the history has been loaded
   */
  #prepareHistory() {
    this.#historyStream = fs.createWriteStream(historyFile, {
      flags: 'a',
      encoding: 'utf8',
    })

    // Load existing history first
    if (fs.existsSync(historyFile)) {
      this.#history = fs.readFileSync(historyFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .reverse()
        .splice(0, maxHistory)
    }
  }

  /**
   * Loads the previous session state from the state file.
   * @returns {void}
   */
  #loadState() {
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
        for (const entry of Object.entries(state)) {
          this.#updateFlagsByName('set', entry, true)
        }

        process.stdout.write('session restored')
      } catch {
        // noop
      }
    }
  }

  /**
   * Creates a new readline interface.
   *
   * @returns {readline.Interface} the readline interface
   */
  #createInterface() {
    this.#rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'heroku > ',
      removeHistoryDuplicates: true,
      historySize: maxHistory,
      completer: async line => {
        if (mcpMode) {
          return [[], line]
        }

        // Use shell-quote to tokenize the line for robust parsing
        const tokens = shellQuote.parse(line)
        const stringTokens = tokens.filter(t => typeof t === 'string')
        const [command = '', ...parts] = stringTokens
        if (command === 'set') {
          return this.#buildSetCompletions(parts)
        }

        const commandMeta = this.#config.findCommand(command)
        if (!commandMeta) {
          const matches = this.#config.commands.filter(({id}) => id.startsWith(command))
          return [matches.map(({id}) => id).sort(), line]
        }

        return this.#buildCompletions(commandMeta, parts, line)
      },
    })
    this.#prepareHistory()
    this.#loadState()

    this.#rl.history.push(...this.#history)
    this.#rl.on('line', this.#processLine)
    this.#rl.once('close', () => {
      this.#historyStream?.close()
      fs.writeFileSync(stateFile, JSON.stringify(Object.fromEntries(this.#setValues)), 'utf8')
    })
    this.#rl.prompt()
  }

  /**
   * Processes the line received from the terminal stdin
   *
   * @param {string} input the line to process
   * @returns {Promise<void>} a promise that resolves when the command has been executed
   */
  #processLine = async input => {
    if (input.trim() === '') {
      this.#rl.prompt()
      return
    }

    this.#history.push(input)
    this.#historyStream?.write(input + '\n')

    const tokens = shellQuote.parse(input)
    const stringTokens = tokens.filter(t => typeof t === 'string')
    // flag/arg extraction
    const {_: [command, ...positionalArgs], ...flags} = yargs(stringTokens, {
      configuration: {
        'camel-case-expansion': false,
        'boolean-negation': false,
      },
    })
    const args = Object.entries(flags).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return [`--${key}`, value]
      }

      return [`--${key}`]
    }).concat(positionalArgs)

    if (command === 'exit') {
      process.exit(0)
    }

    if (command === 'history') {
      process.stdout.write(this.#history.join('\n'))
      this.#rl.prompt()
      return
    }

    if (command === 'set' || command === 'unset') {
      this.#updateFlagsByName(command, args)
      this.#rl.prompt()
      return
    }

    const cmd = this.#config.findCommand(command)

    if (!cmd) {
      console.error(`"${command}" is not a valid command`)
      this.#rl.prompt()
      return
    }

    try {
      const {flags} = cmd
      for (const [key, value] of this.#setValues) {
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

      this.#rl.close()
      this.#rl.off('line', this.#processLine)
      if (mcpMode) {
        process.stdout.write('<<<BEGIN RESULTS>>>\n')
      }

      process.argv.length = 2
      process.argv.push(command, ...args.filter(Boolean))
      await run([command, ...args.filter(Boolean)], this.#config)
    } catch (error) {
      if (mcpMode) {
        process.stderr.write(`<<<ERROR>>>\n${error.message}\n<<<END ERROR>>>\n`)
      } else {
        console.error(error.message)
      }
    } finally {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
      }

      if (mcpMode) {
        process.stdout.write('<<<END RESULTS>>>\n')
      }

      this.#createInterface()
      this.start()
      // Force readline to refresh the current line
      this.#rl.write(null, {ctrl: true, name: 'u'})
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
  #updateFlagsByName(command, args, omitConfirmation) {
    if (command === 'set') {
      const [key, value] = args
      if (key && value) {
        this.#setValues.set(key, value)

        if (!omitConfirmation) {
          process.stdout.write(`setting --${key} to ${value}\n`)
        }

        if (key === 'app') {
          this.#rl.setPrompt(`${value} > `)
        }
      } else {
        const values = []
        for (const [flag, value] of this.#setValues) {
          values.push({flag, value})
        }

        if (values.length === 0) {
          return console.info('no flags set')
        }

        ux.table(values, {
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

      this.#setValues.delete(key)
      if (key === 'app') {
        this.#rl.setPrompt('heroku > ')
      }
    }
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
  async #buildCompletions(commandMeta, flagsOrArgs = [], line = '') {
    const {args, flags} = commandMeta
    const {requiredInputs: requiredFlags, optionalInputs: optionalFlags} = this.#collectInputsFromManifest(flags)
    const {requiredInputs: requiredArgs, optionalInputs: optionalArgs} = this.#collectInputsFromManifest(args)

    const {_: userArgs, ...userFlags} = yargs(flagsOrArgs, {
      configuration: {
        'camel-case-expansion': false,
        'boolean-negation': false,
      },
    })
    const current = flagsOrArgs[flagsOrArgs.length - 1] ?? ''

    // Order of precedence:
    // 1. Required flags
    // 2. Required args
    // 3. Optional flags
    // 4. Optional args
    // 5. End of line
    // Flags *must* occur first since they may influence
    // the completions for args.
    return await this.#getCompletionsForFlag(line, current, requiredFlags, userFlags, commandMeta) ||
      await this.#getCompletionsForArg(current, requiredArgs, userArgs) ||
      await this.#getCompletionsForFlag(line, current, optionalFlags, userFlags, commandMeta) ||
      await this.#getCompletionsForArg(current, optionalArgs, userArgs) ||
      this.#getCompletionsForEndOfLine(line, flags, userFlags)
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
  async #buildSetCompletions(parts) {
    const [name, current] = parts
    if (parts.length > 0 && completionCommandByName.has(name)) {
      return [await this.#getCompletion(name, current), current]
    }

    // Critical to completions operating as expected;
    // the completions must be filtered to omit keys
    // that do not match our name (if a name exists).
    const completions = [...completionCommandByName.keys()]
      .filter(c => !name || c.startsWith(name))

    return [completions, name ?? current]
  }

  /**
   * Get completions for the end of the line.
   *
   * @param {string} line the current line
   * @param {Record<string, unknown>} flags the flags for the command
   * @param {Record<string, unknown>} userFlags the flags that have already been used
   * @returns {[string[], string]} the completions and the current input
   */
  #getCompletionsForEndOfLine(line, flags, userFlags) {
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
  async #getCompletionsForFlag(line, current, flags, userFlags, commandMeta) {
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
        .filter(flag => {
          return !Reflect.has(userFlags, flag.short) && !Reflect.has(userFlags, flag.long) &&
          (!rawFlag || flag[prop]?.startsWith(rawFlag))
        })
        .map(f => isLongFlag ? f.long : f.short)
        .filter(Boolean)

      if (matched?.length > 0) {
        return [matched, rawFlag]
      }
    }

    // Does the flag have a value or is it
    // expected to have a value?
    const flagKeys = Object.keys(userFlags)
    const flag = flagKeys[flagKeys.length - 1]
    const isBooleanFlag = commandMetaWithCharKeys.flags[flag]?.type === 'boolean'
    if (this.#isFlagValueComplete(line) || isBooleanFlag || current === '--' || current === '-') {
      return null
    }

    const {options, type, name} = commandMetaWithCharKeys.flags[flag] ?? {}
    // Options are defined in the metadata
    // for the command. If the flag has options
    // defined, we will attempt to complete
    // based on the options.
    if (type === 'option') {
      if (options?.length > 0) {
        const optionComplete = options.includes(current)
        const matched = options.filter(o => o.startsWith(current))

        if (!optionComplete) {
          return matched.length > 0 ? [matched, current] : [options, current]
        }
      }

      return [await this.#getCompletion(name, isFlag ? '' : current), current]
    }
  }

  /**
   * Get completions for a flag.
   *
   * @param {string} flag the flag to get the completion for
   * @param {string} startsWith the string to match against
   * @returns {Promise<[string[]]>} the completions
   */
  async #getCompletion(flag, startsWith) {
    // attempt to retrieve the options from the
    // Heroku API. If the options have already
    // been retrieved, they will be cached.
    if (completionCommandByName.has(flag)) {
      let result
      if (completionResultsByName.has(flag)) {
        result = completionResultsByName.get(flag)
      }

      if (!result || result.length === 0) {
        const [command, args] = completionCommandByName.get(flag)
        const completionsStr = await this.#captureStdout(() => this.#config.runCommand(command, args)) ?? '[]'
        result = JSON.parse(util.stripVTControlCharacters(completionsStr))
        completionResultsByName.set(flag, result)
      }

      const matched = result
        .map(obj => obj.name ?? obj.id)
        .filter(name => !startsWith || name.startsWith(startsWith))
        .sort()

      return matched
    }
  }

  #isFlagValueComplete(input) {
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
      if (typeof tokens[i] === 'string' && tokens[i].startsWith('-')) {
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
   * Capture stdout by deflecting it to a
   * trap function and returning the output.
   *
   * This is useful for silently capturing the output
   * of a command that normally prints to stdout.
   *
   * @param {CallableFunction} fn the function to capture stdout for
   * @returns {Promise<string>} the output from stdout
   */
  async #captureStdout(fn) {
    const output = []
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
   * Get completions for an arg.
   *
   * @param {string} current the current input
   * @param {({long: string}[])} args the args for the command
   * @param {string[]} userArgs the args that have already been used
   * @returns {Promise<[string[], string] | null>} the completions and the current input
   */
  async #getCompletionsForArg(current, args = [], userArgs = []) {
    if (userArgs.length <= args.length) {
      const arg = args[userArgs.length]
      if (arg) {
        const {long} = arg
        if (completionCommandByName.has(long)) {
          const completions = await this.#getCompletion(long, current)
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
   * Collect inputs from the command manifest and sorts
   * them by type and then by required status.
   *
   * @param {Record<string, unknown>} commandMeta the metadata from the command manifest
   * @returns {{requiredInputs: {long: string, short: string}[], optionalInputs: {long: string, short: string}[]}} the inputs from the command manifest
   */
  #collectInputsFromManifest(commandMeta) {
    const requiredInputs = []
    const optionalInputs = []

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
      const {required: isRequired, char: short, name: long} = commandMeta[key]
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

    return {requiredInputs, optionalInputs}
  }
}
module.exports.herokuRepl = async function (config) {
  return new HerokuRepl(config)
}
