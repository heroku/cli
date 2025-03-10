// import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import type {Command as CommandType} from '@oclif/core'

export interface ToolFunction {
  name: string;
}

export interface ToolParams {
  db_attachment?: string;
  cmd?: string;
}

export interface RuntimeParams {
  target_app_name: string;
  tool_params?: ToolParams;
}

export interface ParameterProperty {
  type: string;
  description: string;
}

export interface ToolParameters {
  type: string;
  properties: {
    [key: string]: ParameterProperty;
  };
  required?: string[];
}

export interface Tool {
  type: 'function';
  function: ToolFunction;
  runtime_params?: RuntimeParams;
  description?: string;
  parameters?: ToolParameters;
}

export default class Index extends Command {
  static topic = 'tools';
  static description = 'list the tools available to the Agent';
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const tools = []
    for (const commandManifest of this.config.commands) {
      // do not list this command as a tool
      if (commandManifest.id === 'tool' || commandManifest.description?.includes('(sudo)')) {
        continue
      }

      tools.push(this.commandJsonToToolJson(commandManifest))
    }

    if (flags.json)
      process.stdout.write(JSON.stringify(tools, null, 2) + '\n')
    else {
      console.table(tools, ['function name', 'short description', 'param names'])
    }
  }

  protected commandJsonToToolJson(commandJson: CommandType.Loadable): Tool {
    const {id, flags, args, description} = commandJson
    const {properties, required} = this.commandFlagsAndArgsToToolProperties(flags, args)

    const tool: Tool = {
      type: 'function',
      function: {
        name: id.replace(/[:]/g, '_').replace(/[-]/g, '__'),
      },
      description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    }

    // -------------------------
    // Non-enumerable fields.
    Reflect.defineProperty(tool, 'function name', {
      enumerable: false,
      get: () => tool.function.name,
    })

    Reflect.defineProperty(tool, 'param names', {
      enumerable: false,
      get: () => Object.keys(properties),
    })

    const shortDescription = description?.length ?? 0 > 50 ? (description ?? '').slice(0, 50) + '...' : description
    Reflect.defineProperty(tool, 'short description', {
      enumerable: false,
      get: () => shortDescription ?? '',
    })

    return tool
  }

  protected commandFlagsAndArgsToToolProperties(commandFlags: CommandType.Cached['flags'], commandArgs: CommandType.Cached['args']): {properties: Record<string, ParameterProperty>, required: string[]} {
    const properties: Record<string, ParameterProperty> = {}
    const requiredFlagsAndArgs = [] as string[]
    for (const [flagName, flag] of Object.entries(commandFlags)) {
      const {description: flagDescription, hidden, required} = flag

      if (!flagDescription || hidden) {
        continue
      }

      if (required) {
        requiredFlagsAndArgs.push(flagName)
      }

      const description = `${flagDescription} (this is a ${required ? 'required' : 'optional'} parameter)`

      properties[flagName] = {
        type: 'string',
        description,
      }
    }

    for (const [argName, arg] of Object.entries(commandArgs)) {
      const {description: argDescription, options, required, hidden} = arg

      if (!argDescription || hidden) {
        continue
      }

      if (required) {
        requiredFlagsAndArgs.push(argName)
      }

      const optionsStr = options ? `. Valid options are: ${options.join(',')}` : undefined
      const description = `${argDescription}${optionsStr} (this is a ${required ? 'required' : 'optional'} parameter)`

      properties[argName] = {
        type: 'string',
        description,
      }
    }

    return {properties, required: requiredFlagsAndArgs}
  }
}
