# Heroku CLI REPL

The Heroku CLI REPL (Read-Eval-Print Loop) feature provides an interactive environment to run Heroku CLI commands without typing `heroku` each time. 

Use it when running multiple commands in sequence or exploring the CLI.

## Benefits

* Run commands without typing `heroku` each time
* [Set and persist flags](#set-persistent-flags) across multiple commands
* Get [command completions](#command-completions) and help
* See an interactive [command history](#command-history)
* Persist session state

## Start a REPL

Start a REPL interactive environment with this command:
```term
$ heroku --repl
```
## Exit a REPL

To exit the REPL, type `exit` or press `Ctrl`+`D`.

## Set Persistent Flags

You can set flags that persist across commands. For example, to persist an app's name in your commands:

```term
$ heroku --repl
heroku> set app example-app
setting --app to example-app
example-app> ps
=== example-app Dynos
web.1: up 2024/03/19 10:00:00 +0000 (~ 1h ago)
```

To view your persisted flags:

```term
example-app> set
Flag    Value
app     example-app
```

To remove a persisted flag:

```term
example-app> unset app
unsetting --app
heroku>
```

## Command Completion

The REPL provides intelligent command completion. Press `tab` to see available commands and options:

```term
heroku> pipelines:create --app <tab><tab>
heroku> spaces:create --team <tab><tab>
```

The REPL supports completion for various resources including:

* Apps
* Organizations
* Teams
* Spaces
* Pipelines
* Add-ons
* Domains
* Dynos
* Releases
* Stacks

## Command History

The REPL maintains a history of your commands. View your history with:

```term
heroku> history
```

Use the up and down arrow keys to navigate through your command history.

## Additional Reading

* [Heroku CLI](heroku-cli)
* [Heroku CLI Commands](cli-commands)
* [Heroku CLI Interactive Prompt](cli-prompt)
