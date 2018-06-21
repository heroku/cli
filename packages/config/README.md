@heroku-cli/plugin-config
=========================



[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-config.svg)](https://npmjs.org/package/@heroku-cli/plugin-config)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-config/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-config/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-config?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-config/branch/master)
[![Codecov](https://codecov.io/gh/heroku/heroku-cli-plugin-config/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-cli-plugin-config)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-config.svg)](https://npmjs.org/package/@heroku-cli/plugin-config)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-config.svg)](https://github.com/heroku/heroku-cli-plugin-config/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-config
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-config/7.4.8 darwin-x64 node-v8.11.3
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku config`](#heroku-config)
* [`heroku config:edit [KEY]`](#heroku-configedit-key)
* [`heroku config:get KEY...`](#heroku-configget-key)

## `heroku config`

display the config vars for an app

```
USAGE
  $ heroku config

OPTIONS
  -a, --app=app        (required) app to run command against
  -j, --json           output config vars in json format
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format
```

_See code: [src/commands/config/index.ts](https://github.com/heroku/cli/blob/v7.4.8/packages/config/src/commands/config/index.ts)_

## `heroku config:edit [KEY]`

interactively edit config vars

```
USAGE
  $ heroku config:edit [KEY]

ARGUMENTS
  KEY  edit a single key

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  This command opens the app config in a text editor set by $VISUAL or $EDITOR.
  Any variables added/removed/changed will be updated on the app after saving and closing the file.

EXAMPLES
  # edit with vim
  $ EDITOR="vim" heroku config:edit
  # edit with emacs
  $ EDITOR="emacs" heroku config:edit
  # edit with pico
  $ EDITOR="pico" heroku config:edit
  # edit with atom editor
  $ VISUAL="atom --wait" heroku config:edit
```

_See code: [src/commands/config/edit.ts](https://github.com/heroku/cli/blob/v7.4.8/packages/config/src/commands/config/edit.ts)_

## `heroku config:get KEY...`

display a single config value for an app

```
USAGE
  $ heroku config:get KEY...

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format

EXAMPLES
  $ heroku config:get RAILS_ENV
  production
```

_See code: [src/commands/config/get.ts](https://github.com/heroku/cli/blob/v7.4.8/packages/config/src/commands/config/get.ts)_
<!-- commandsstop -->
