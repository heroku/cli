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
@heroku-cli/plugin-config/1.1.0 linux-x64 node-v10.0.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku config:edit [KEY]`](#heroku-configedit-key)

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
```

_See code: [src/commands/config/edit.ts](https://github.com/heroku/heroku-cli-plugin-config/blob/v1.1.0/src/commands/config/edit.ts)_
<!-- commandsstop -->
