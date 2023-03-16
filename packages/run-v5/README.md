heroku-run [![Circle CI](https://circleci.com/gh/heroku/heroku-run.svg?style=svg)](https://circleci.com/gh/heroku/heroku-run)
==========

[![License](https://img.shields.io/github/license/heroku/heroku-run.svg)](https://github.com/heroku/heroku-run/blob/master/LICENSE)

Heroku CLI plugin to run one-off dyno processes.

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
  $ heroku logs
  2012-01-01T12:00:00+00:00 heroku[api]: Config add EXAMPLE by email@example.com
  2012-01-01T12:00:01+00:00 heroku[api]: Release v1 created by email@example.com
```

_See code: [commands/logs.js](https://github.com/heroku/cli/blob/v7.68.0/packages/run-v5/commands/logs.js)_

## `heroku run`

run a one-off process inside a heroku dyno

```
USAGE
  $ heroku run

OPTIONS
  -a, --app=app        (required) app to run command against
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
  Running bash on app.... up, run.1
  ~ $

  $ heroku run -s standard-2x -- myscript.sh -a arg1 -s arg2
  Running myscript.sh -a arg1 -s arg2 on app.... up, run.1
```

_See code: [commands/run.js](https://github.com/heroku/cli/blob/v7.68.0/packages/run-v5/commands/run.js)_

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
  -t, --tail           stream logs from the dyno
  --type=type          process type

EXAMPLES
  $ heroku run:detached ls
  Running ls on app [detached]... up, run.1
  Run heroku logs -a app -p run.1 to view the output.
```

_See code: [commands/run/detached.js](https://github.com/heroku/cli/blob/v7.68.0/packages/run-v5/commands/run/detached.js)_
<!-- commandsstop -->
