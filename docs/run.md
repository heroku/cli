`heroku run`
============

run a one-off process inside a Heroku dyno

* [`heroku run`](#heroku-run)
* [`heroku run:detached`](#heroku-rundetached)
* [`heroku run:inside`](#heroku-runinside)

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

_See code: [@heroku-cli/plugin-run](https://github.com/heroku/cli/blob/v7.41.1/src/commands/run/index.ts)_

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

_See code: [@heroku-cli/plugin-run](https://github.com/heroku/cli/blob/v7.41.1/src/commands/run/detached.ts)_

## `heroku run:inside`

run a one-off process inside an existing heroku dyno

```
USAGE
  $ heroku run:inside

OPTIONS
  -a, --app=app        (required) app to run command against
  -e, --env=env        environment variables to set (use ';' to split multiple vars)
  -r, --remote=remote  git remote of app to use
  -x, --exit-code      passthrough the exit code of the remote command

EXAMPLE
  $ heroku run:inside web.1 bash
```

_See code: [@heroku-cli/plugin-run](https://github.com/heroku/cli/blob/v7.41.1/src/commands/run/inside.ts)_
