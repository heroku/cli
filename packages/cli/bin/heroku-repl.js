const readline = require('node:readline/promises')
const yargs = require('yargs-parser')
const util = require('util')

const completionCommandByName = new Map([
  ['app', ['apps', ['--all', '--json']]],
  ['org', ['orgs', ['--json']]],
  ['team', ['teams', ['--json']]],
  ['space', ['spaces', ['--json']]],
  ['pipeline', ['pipelines', ['--json']]],
  ['addon', ['addons', ['--json']]],
  ['domain', ['domains', ['--json']]],
  ['dyno', ['dynos', ['--json']]],
  ['release', ['releases', ['--json']]],
  ['slug', ['slugs', [' --json']]],
  ['stack', ['stacks', ['--json']]],
])

const completionResultsByName = new Map()

class HerokuRepl {
  #config
  #flagsByName = new Map()
  #history = []
  #rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'heroku > ',
    removeHistoryDuplicates: true,
    completer: async line => {
      const [command, ...parts] = line.split(' ')
      if (command === 'set') {
        return this.#buildSetCompletions(parts)
      }

      const commandMeta = this.#config.findCommand(command)
      if (!commandMeta) {
        const matches = this.#config.commands.filter(({id}) => id.startsWith(command))
        return [matches.map(({id}) => id).sort(), line]
      }

      return this.#buildCompletions(commandMeta, parts)
    },
  })

  constructor(config) {
    this.#config = config
    this.#rl.on('line', this.#onLine)
    this.#rl.prompt()
  }

  /**
   * Waits for the REPL to finish.
   *
   * @returns {Promise<void>} a promise that resolves when the REPL is done
   */
  async done() {
    await new Promise(resolve => {
      this.#rl.once('close', () => {
        resolve()
      })
    })
  }

  /**
   * Process a line of input.
   * This method will parse the input
   * and run the command if it is valid.
   * If the command is invalid, an error
   * message will be displayed.
   *
   * @param {string} line the line to process
   * @returns {Promise<void>} a promise that resolves when the line has been processed
   */
  #onLine = async line => {
    const input = line.trim()

    if (input) {
      this.#history.push(input)

      const [command, ...args] = input.split(' ')
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
        process.stderr.write(`"${command}" is not a valid command\n`)
        this.#rl.prompt()
      }

      try {
        const {flags} = cmd
        for (const [key, value] of this.#flagsByName) {
          if (Reflect.has(flags, key)) {
            args.push(`--${key}`, value)
          }
        }

        await this.#config.runCommand(command, args.filter(Boolean))
      } catch (error) {
        console.error(error.message)
      }
    }

    this.#rl.prompt()
  }

  #updateFlagsByName(command, args) {
    if (command === 'set') {
      const [key, value] = args
      if (key && value) {
        this.#flagsByName.set(key, value)
        process.stdout.write(`setting --${key} to ${value}\n`)
        if (key === 'app') {
          this.#rl.setPrompt(`${value} > `)
        }
      } else {
        console.table(Array.from(this.#flagsByName))
      }
    }

    if (command === 'unset') {
      const [key] = args
      process.stdout.write(`unsetting --${key}\n`)
      this.#flagsByName.delete(key)
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
   * @returns {Promise<[string[], string]>} the completions and the current input
   */
  async #buildCompletions(commandMeta, flagsOrArgs = []) {
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
    // Flags occur first since they may influence
    // the completions for args.
    return await this.#getCompletionsForFlag(current, requiredFlags, userFlags, commandMeta) ||
      this.#getCompletionsForArg(current, requiredArgs, userArgs, commandMeta) ||
      await this.#getCompletionsForFlag(current, optionalFlags, userFlags, commandMeta) ||
      this.#getCompletionsForArg(current, optionalArgs, userArgs, commandMeta) ||
      this.#getCompletionsForEndOfLine(flags, userFlags)
  }

  async #buildSetCompletions(parts) {
    const [name, current] = parts
    if (parts.length > 0 && completionCommandByName.has(name)) {
      return [await this.#getCompletion(name, current), current]
    }

    const completions = [...completionCommandByName.keys()]
      .filter(c => !name || c.startsWith(name))

    return [completions, name ?? current]
  }

  /**
   * Get completions for the end of the line.
   *
   * @param {Record<string, unknown>} flags the flags for the command
   * @param {Record<string, unknown>} userFlags the flags that have already been used
   * @returns {[string[], string]} the completions and the current input
   */
  #getCompletionsForEndOfLine(flags, userFlags) {
    const flagKeys = Object.keys(userFlags)
    // If there are no more flags to complete,
    // return an empty array.
    return flagKeys.length < Object.keys(flags).length ? [[' --'], ''] : [[], '']
  }

  /**
   * Get completions for a flag or flag value.
   *
   * @param {string} current the current input
   * @param {string[]} flags the flags for the command
   * @param {string[]} userFlags the flags that have already been used
   * @param {Record<string, unknown>} commandMeta the metadata for the command
   * @return {Promise<[string[], string]>} the completions and the current input
   */
  async #getCompletionsForFlag(current, flags, userFlags, commandMeta) {
    // flag completion for long and short flags.
    // flags that have already been used are
    // not included in the completions.
    const isFlag = current.startsWith('-')
    if (isFlag) {
      const isLongFlag = current.startsWith('--')
      const rawFlag = isLongFlag ? current.slice(2) : current.slice(1)
      const matched = flags
        .map(f => isLongFlag ? f.long : f.short)
        .filter(flag => !Reflect.has(userFlags, flag) && (!rawFlag || flag.startsWith(rawFlag)))

      if (matched.length > 0) {
        return [matched, rawFlag]
      }
    }

    // Does the flag have a value?
    const flagKeys = Object.keys(userFlags)
    const flag = flagKeys[flagKeys.length - 1]
    if (!flag) {
      return null
    }

    const {options, type} = commandMeta.flags[flag] ?? {}
    // Options are defined in the metadata
    // for the command. If the flag has options
    // defined, we will attempt to complete
    // the options.
    if (type === 'option') {
      if (options?.length > 0) {
        const optionComplete = options.includes(current)
        const matched = options.filter(o => o.startsWith(current))

        if (!optionComplete) {
          return matched.length > 0 ? [matched, current] : [options, current]
        }
      }

      return [await this.#getCompletion(flag, isFlag ? '' : current), current]
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

      if (!result) {
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

  /**
   * Capture stdout
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
   * @param {({long: string}[])} requiredArgs the required args for the command
   * @param {({long: string}[])} optionalArgs the optional args for the command
   * @param {string[]} userArgs the args that have already been used
   * @returns {[string[], string]} the completions and the current input
   */
  #getCompletionsForArg(current, requiredArgs = [], optionalArgs = [], userArgs = []) {
    if (userArgs.length <= requiredArgs.length) {
      const arg = requiredArgs[userArgs.length - 1]
      if (arg) {
        // attempt to retrieve completions
        return [[`<${arg.long}>`], current]
      }
    }

    if (userArgs.length <= requiredArgs.length + optionalArgs.length) {
      const arg = optionalArgs[userArgs.length - 1]
      if (arg) {
        // attempt to retrieve completions
        return [[`[<${arg.long}>]`], current]
      }
    }
  }

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

    keysByType.forEach(long => {
      const {required: isRequired, char: short} = commandMeta[long]
      if (isRequired) {
        requiredInputs.push({long, short})
        return
      }

      optionalInputs.push({long, short})
    })
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
  const repl = new HerokuRepl(config)
  return repl.done()
}
