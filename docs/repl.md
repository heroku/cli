# Heroku CLI REPL

The Heroku CLI REPL (Read-Eval-Print Loop) provides an interactive environment for running Heroku CLI commands.

## Usage

```term
$ heroku --repl
```

## Description

The REPL provides an interactive environment where you can run Heroku CLI commands without typing `heroku` each time. This is useful for running multiple commands in sequence or exploring the CLI.

### Features

* Run commands without typing `heroku` each time
* Set and persist flags across multiple commands
* Get command completions and help
* Interactive command history
* Session state persistence

### Setting Persistent Flags

You can set flags that persist across commands:

```term
$ heroku --repl
heroku> set app example-app
setting --app to example-app
example-app> ps
=== example-app Dynos
web.1: up 2024/03/19 10:00:00 +0000 (~ 1h ago)
```

To view your current settings:

```term
example-app> set
Flag    Value
app     example-app
```

To remove a setting:

```term
example-app> unset app
unsetting --app
heroku>
```

### Command History

The REPL maintains a history of your commands. View your history with:

```term
heroku> history
```

You can also use the up and down arrow keys to navigate through your command history.

### Command Completion

The REPL provides intelligent command completion. Press `Tab` to see available commands and options:

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

## Exiting the REPL

To exit the REPL, type `exit` or press `Ctrl+D`.

## Related Topics

* [Heroku CLI](heroku-cli)
* [Heroku CLI Commands](cli-commands)
