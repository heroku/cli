# Heroku CLI Interactive Prompt

The Heroku CLI interactive prompt guides you through running commands by prompting for required arguments and flags.

## Usage

```term
$ heroku --prompt COMMAND
```

## Description

The interactive prompt helps you run Heroku CLI commands by guiding you through the required inputs. This is particularly useful when you're not sure about all the required arguments and flags for a command.

### Features

* Prompts for required arguments
* Prompts for required flags
* Provides descriptions and examples for each input
* Validates input before executing the command

### Example Session

```term
$ heroku --prompt config:set
Enter key: DATABASE_URL
Enter value: postgres://...
Setting DATABASE_URL and restarting example-app... done
```

## Common Use Cases

* Setting configuration variables
* Creating new resources
* Running commands with multiple required flags
* Learning command requirements

## Related Topics

* [Heroku CLI](heroku-cli)
* [Heroku CLI Commands](cli-commands)

_See code: [src/commands/prompt.ts](https://github.com/heroku/cli/blob/v10.9.0/packages/cli/src/commands/prompt.ts)_
