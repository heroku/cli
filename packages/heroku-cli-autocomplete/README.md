@heroku-cli/plugin-autocomplete
===============================



[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-autocomplete.svg)](https://npmjs.org/package/@heroku-cli/plugin-autocomplete)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-autocomplete/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-autocomplete/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-autocomplete?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-autocomplete/branch/master)
[![Codecov](https://codecov.io/gh/heroku/heroku-cli-autocomplete/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-cli-autocomplete)
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
$ heroku (-v|--version|version)
@heroku-cli/plugin-autocomplete/1.0.5 darwin-x64 node-v9.3.0
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
  $ heroku autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -s, --skip-instructions  don't show installation instructions

EXAMPLES
  $ heroku autocomplete

  $ heroku autocomplete bash

  $ heroku autocomplete zsh
```

_See code: [src/commands/autocomplete.ts](https://github.com/heroku/heroku-cli-autocomplete/blob/v1.0.5/src/commands/autocomplete.ts)_
<!-- commandsstop -->
