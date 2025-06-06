# Heroku CLI Interactive Prompt

The interactive prompt helps you run Heroku CLI commands by guiding you through the required inputs. 

Prompting is particularly useful when you're unsure about what required or optional arguments and flags a command uses.

## Benefits

* Learn requirements for any command, like setting configuration vars
* Run commands with multiple required flags easily, such as when creating new resources
* Never forget optional arguments or flags when you run a command
* Get descriptions for each input
* Validate input before executing the command

## Usage

Start prompting by adding `--prompt` after any command:
```term
$ heroku COMMAND --prompt
```

## Example Session

```term
$ heroku config:set --prompt
Enter key: DATABASE_URL
Enter value: postgres://...
Setting DATABASE_URL and restarting example-app... done
```

## Additional Reading

* [Heroku CLI](heroku-cli)
* [Heroku CLI Commands](cli-commands)
* [Heroku CLI REPL](cli-repl)
_See code: [src/commands/prompt.ts](https://github.com/heroku/cli/blob/v10.9.0/packages/cli/src/commands/prompt.ts)_
