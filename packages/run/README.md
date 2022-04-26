# @heroku-cli/plugin-run

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-run.svg)](https://npmjs.org/package/@heroku-cli/plugin-run)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-run/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-run/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-run?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-run/branch/master)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-run.svg)](https://npmjs.org/package/@heroku-cli/plugin-run)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-run.svg)](https://github.com/heroku/heroku-cli-plugin-run/blob/master/package.json)

<!-- toc -->
* [@heroku-cli/plugin-run](#heroku-cliplugin-run)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-run
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-run/7.60.0 darwin-x64 node-v14.18.2
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`heroku logs`](#heroku-logs)
* [`heroku run`](#heroku-run)
* [`heroku run:detached`](#heroku-rundetached)

## `heroku logs`

display recent log output

```
USAGE
  $ heroku logs

OPTIONS
  -a, --app=app        (required) app to run command against
  -d, --dyno=dyno      only show output from this dyno type (such as "web" or "worker")
  -n, --num=num        number of lines to display
  -r, --remote=remote  git remote of app to use
  -s, --source=source  only show output from this source (such as "app" or "heroku")
  -t, --tail           continually stream logs
  --force-colors       force use of colors (even on non-tty output)

DESCRIPTION
  disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0

EXAMPLES
  $ heroku logs --app=my-app
  $ heroku logs --num=50
  $ heroku logs --dyno=web --app=my-app
  $ heroku logs --app=my-app --tail
```

_See code: [src/commands/logs.ts](https://github.com/heroku/cli/blob/v7.60.0/src/commands/logs.ts)_

## `heroku run`

run a one-off process inside a heroku dyno

```
USAGE
  $ heroku run

OPTIONS
  -a, --app=app        (required) parent app used by review apps
  -e, --env=env        environment variables to set (use ';' to split multiple vars)
  -r, --remote=remote  git remote of app to use
  -s, --size=size      dyno size
  -x, --exit-code      passthrough the exit code of the remote command
  --no-notify          disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)
  --no-tty             force the command to not run in a tty
  --type=type          process type

DESCRIPTION
  Shows a notification if the dyno takes more than 20 seconds to start.

EXAMPLES
  $ heroku run bash
  $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
```

_See code: [src/commands/run/index.ts](https://github.com/heroku/cli/blob/v7.60.0/src/commands/run/index.ts)_

## `heroku run:detached`

run a detached dyno, where output is sent to your logs

```
USAGE
  $ heroku run:detached

OPTIONS
  -a, --app=app        (required) app to run command against
  -e, --env=env        environment variables to set (use ';' to split multiple vars)
  -r, --remote=remote  git remote of app to use
  -s, --size=size      dyno size
  -t, --tail           continually stream logs
  --type=type          process type

EXAMPLE
  $ heroku run:detached ls
```

_See code: [src/commands/run/detached.ts](https://github.com/heroku/cli/blob/v7.60.0/src/commands/run/detached.ts)_
<!-- commandsstop -->
