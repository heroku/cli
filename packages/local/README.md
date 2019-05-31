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
$ npm install -g local
$ oclif-example COMMAND
running command...
$ oclif-example (-v|--version|version)
local/0.0.0 darwin-x64 node-v10.15.3
$ oclif-example --help [COMMAND]
USAGE
  $ oclif-example COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`oclif-example local:run`](#oclif-example-localrun)
* [`oclif-example local:start`](#oclif-example-localstart)
* [`oclif-example local:version`](#oclif-example-localversion)

## `oclif-example local:run`

run a one-off command

```
USAGE
  $ oclif-example local:run

OPTIONS
  -e, --env=env
  -p, --port=port

EXAMPLE
  $ heroku local:run bin/migrate
```

_See code: [src/commands/local/run.ts](https://github.com/chadian/local/blob/v0.0.0/src/commands/local/run.ts)_

## `oclif-example local:start`

run heroku app locally

```
USAGE
  $ oclif-example local:start

OPTIONS
  -e, --env=env            location of env file (defaults to .env)
  -f, --procfile=procfile  use a different Procfile
  -p, --port=port          port to listen on

EXAMPLE
  $ heroku local
       $ heroku local web
       $ heroku local web=2
       $ heroku local web=1,worker=2
```

_See code: [src/commands/local/start.ts](https://github.com/chadian/local/blob/v0.0.0/src/commands/local/start.ts)_

## `oclif-example local:version`

display node-foreman version

```
USAGE
  $ oclif-example local:version
```

_See code: [src/commands/local/version.ts](https://github.com/chadian/local/blob/v0.0.0/src/commands/local/version.ts)_
<!-- commandsstop -->
