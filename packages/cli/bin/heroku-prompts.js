const fs = require('node:fs')
const inquirer = require('inquirer')

function choicesPrompt(description, choices, required, defaultValue) {
  return inquirer.prompt([{
    type: 'list',
    name: 'choices',
    message: description,
    choices,
    default: defaultValue,
    validate(input) {
      if (!required || input) {
        return true
      }

      return `${description} is required`
    },
  }])
}

function prompt(description, required) {
  return inquirer.prompt([{
    type: 'input',
    name: 'input',
    message: description,
    validate(input) {
      if (!required || input.trim()) {
        return true
      }

      return `${description} is required`
    },
  }])
}

function filePrompt(description, defaultPath) {
  return inquirer.prompt([{
    type: 'input',
    name: 'path',
    message: description,
    default: defaultPath,
    validate(input) {
      if (fs.existsSync(input)) {
        return true
      }

      return 'File does not exist. Please enter a valid file path.'
    },
  }])
}

const showBooleanPrompt = async (commandFlag, userInputMap, defaultOption) => {
  const {description, default: defaultValue, name: flagOrArgName} = commandFlag
  const choice = await choicesPrompt(description, [
    {name: 'yes', value: true},
    {name: 'no', value: false},
  ], defaultOption)

  // user cancelled
  if (choice === undefined || choice === 'Cancel') {
    return true
  }

  if (choice === 'Yes') {
    userInputMap.set(flagOrArgName, defaultValue)
  }

  return false
}

const showOtherDialog = async (commandFlagOrArg, userInputMap) => {
  const {description, default: defaultValue, options, required, name: flagOrArgName} = commandFlagOrArg

  let input
  const isFileInput = description?.includes('absolute path')
  if (isFileInput) {
    input = await filePrompt(description, '')
  } else if (options) {
    const choices = options.map(option => ({name: option, value: option}))
    input = await choicesPrompt(`Select the ${description}`, choices, required, defaultValue)
  } else {
    input = await prompt(`${description.slice(0, 1).toUpperCase()}${description.slice(1)} (${required ? 'required' : 'optional - press "Enter" to bypass'})`, required)
  }

  if (input === undefined) {
    return true
  }

  if (input !== '') {
    userInputMap.set(flagOrArgName, input)
  }

  return false
}

function collectInputsFromManifest(flagsOrArgsManifest, omitOptional) {
  const requiredInputs = []
  const optionalInputs = []

  // Prioritize options over booleans to
  // prevent the user from yo-yo back and
  // forth between the different input dialogs
  const keysByType = Object.keys(flagsOrArgsManifest).sort((a, b) => {
    const {type: aType} = flagsOrArgsManifest[a]
    const {type: bType} = flagsOrArgsManifest[b]
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

  keysByType.forEach(key => {
    const isRequired = Reflect.get(flagsOrArgsManifest[key], 'required');
    (isRequired ? requiredInputs : optionalInputs).push(key)
  })
  // Prioritize required inputs
  // over optional inputs when
  // prompting the user.
  // required inputs are sorted
  // alphabetically. optional
  // inputs are sorted alphabetically
  // and then pushed to the end of
  // the list.
  requiredInputs.sort((a, b) => {
    if (a < b) {
      return -1
    }

    if (a > b) {
      return 1
    }

    return 0
  })
  // Include optional only when not explicitly omitted
  return omitOptional ? requiredInputs : [...requiredInputs, ...optionalInputs]
}

async function getInput(flagsOrArgsManifest, userInputMap, omitOptional) {
  const flagsOrArgs = collectInputsFromManifest(flagsOrArgsManifest, omitOptional)

  for (const flagOrArg of flagsOrArgs) {
    const {name, description, type, hidden} = flagsOrArgsManifest[flagOrArg]
    if (userInputMap.has(name)) {
      continue
    }

    // hidden args and flags may be exposed later
    // based on the user type. For now, skip them.
    if (!description || hidden) {
      continue
    }

    const cancelled = await (type === 'boolean' ? showBooleanPrompt : showOtherDialog)(flagsOrArgsManifest[flagOrArg], userInputMap)
    if (cancelled) {
      return true
    }
  }

  return false
}

async function promptForInputs(commandName, commandManifest, userArgs, userFlags) {
  const {args, flags} = commandManifest

  const userInputByArg = new Map()
  Object.keys(args).forEach((argKey, index) => {
    if (userArgs[index]) {
      userInputByArg.set(argKey, userArgs[index])
    }
  })

  let cancelled = await getInput(args, userInputByArg)
  if (cancelled) {
    return {userInputByArg}
  }

  const userInputByFlag = new Map()
  Object.keys(flags).forEach(flagKey => {
    const {name, char} = flags[flagKey]
    if (userFlags[name] || userFlags[char]) {
      userInputByFlag.set(flagKey, userFlags[flagKey])
    }
  })
  cancelled = await getInput(flags, userInputByFlag)
  if (cancelled) {
    return
  }

  return {userInputByArg, userInputByFlag}
}

module.exports.promptUser =  async (config, commandName, args, flags) => {
  const commandMeta = config.findCommand(commandName)
  if (!commandMeta) {
    process.stderr.write(`"${commandName}" not a valid command\n$ `)
    return
  }

  const {userInputByArg, userInputByFlag} = await promptForInputs(commandName, commandMeta, args, flags)

  try {
    for (const [, {input: argValue}] of userInputByArg) {
      if (argValue) {
        args.push(argValue)
      }
    }

    for (const [flagName, {input: flagValue}] of userInputByFlag) {
      if (!flagValue) {
        continue
      }

      if (flagValue === true) {
        args.push(`--${flagName}`)
        continue
      }

      args.push(`--${flagName}`, flagValue)
    }

    return args
  } catch (error) {
    process.stderr.write(error.message)
  }
}
