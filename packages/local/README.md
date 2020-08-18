local
=====



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/local.svg)](https://npmjs.org/package/local)
[![CircleCI](https://circleci.com/gh/chadian/local/tree/master.svg?style=shield)](https://circleci.com/gh/chadian/local/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/chadian/local?branch=master&svg=true)](https://ci.appveyor.com/project/chadian/local/branch/master)
[![Codecov](https://codecov.io/gh/chadian/local/branch/master/graph/badge.svg)](https://codecov.io/gh/chadian/local)
[![Downloads/week](https://img.shields.io/npm/dw/local.svg)](https://npmjs.org/package/local)
[![License](https://img.shields.io/npm/l/local.svg)](https://github.com/chadian/local/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-local
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-local/7.42.8 darwin-x64 node-v12.12.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku local [PROCESSNAME]`](#heroku-local-processname)
* [`heroku local:run`](#heroku-localrun)
* [`heroku local:version`](#heroku-localversion)

## `heroku local [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ heroku local [PROCESSNAME]

OPTIONS
  -e, --env=env            location of env file (defaults to .env)
  -f, --procfile=procfile  use a different Procfile
  -p, --port=port          port to listen on

DESCRIPTION
  Start the application specified by a Procfile (defaults to ./Procfile)

ALIASES
  $ heroku local:start

EXAMPLE
  $ heroku local
  $ heroku local web
  $ heroku local web=2
  $ heroku local web=1,worker=2
```

_See code: [src/commands/local/index.ts](https://github.com/heroku/cli/blob/v7.42.8/src/commands/local/index.ts)_

## `heroku local:run`

run a one-off command

```
USAGE
  $ heroku local:run

OPTIONS
  -e, --env=env
  -p, --port=port

EXAMPLE
  $ heroku local:run bin/migrate
```

_See code: [src/commands/local/run.ts](https://github.com/heroku/cli/blob/v7.42.8/src/commands/local/run.ts)_

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version
```

_See code: [src/commands/local/version.ts](https://github.com/heroku/cli/blob/v7.42.8/src/commands/local/version.ts)_
<!-- commandsstop -->
