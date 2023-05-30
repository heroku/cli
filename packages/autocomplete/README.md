@heroku-cli/plugin-autocomplete
===============================



[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-autocomplete.svg)](https://npmjs.org/package/@heroku-cli/plugin-autocomplete)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-autocomplete/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-autocomplete/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-autocomplete?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-autocomplete/branch/master)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-autocomplete.svg)](https://npmjs.org/package/@heroku-cli/plugin-autocomplete)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-autocomplete.svg)](https://github.com/heroku/heroku-cli-autocomplete/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-autocomplete
$ heroku COMMAND
running command...
$ heroku (--version|-v)
@heroku-cli/plugin-autocomplete/8.1.5 darwin-x64 node-v16.19.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku autocomplete [SHELL]`](#heroku-autocomplete-shell)

## `heroku autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ heroku autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  refresh cache only (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ heroku autocomplete

  $ heroku autocomplete bash

  $ heroku autocomplete zsh

  $ heroku autocomplete --refresh-cache
```

_See code: [src/commands/autocomplete/index.ts](https://github.com/heroku/cli/blob/v8.1.5/packages/autocomplete/src/commands/autocomplete/index.ts)_
<!-- commandsstop -->
