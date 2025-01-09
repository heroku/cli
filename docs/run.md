`heroku run`
============

run a one-off process inside a Heroku dyno

* [`heroku run`](#heroku-run)
* [`heroku run:detached`](#heroku-rundetached)
* [`heroku run:inside DYNO_NAME COMMAND`](#heroku-runinside-dyno_name-command)

## `heroku run`

run a one-off process inside a heroku dyno

```
USAGE
  $ heroku run -a <value> [-r <value>] [-s <value>] [--type <value>] [-x] [-e <value>] [--no-tty]
    [--no-notify]

FLAGS
  -a, --app=<value>     (required) parent app used by review apps
  -e, --env=<value>     environment variables to set (use ';' to split multiple vars)
  -r, --remote=<value>  git remote of app to use
  -s, --size=<value>    dyno size
  -x, --exit-code       passthrough the exit code of the remote command
      --no-notify       disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)
      --no-tty          force the command to not run in a tty
      --type=<value>    process type

DESCRIPTION
  run a one-off process inside a heroku dyno
  Shows a notification if the dyno takes more than 20 seconds to start.

EXAMPLES
  $ heroku run bash

  $ heroku run -s standard-2x -- myscript.sh -a arg1 -s arg2
```

_See code: [src/commands/run/index.ts](https://github.com/heroku/cli/blob/v10.0.2/packages/cli/src/commands/run/index.ts)_

## `heroku run:detached`

run a detached dyno, where output is sent to your logs

```
USAGE
  $ heroku run:detached -a <value> [-r <value>] [-e <value>] [-s <value>] [-t] [--type <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -e, --env=<value>     environment variables to set (use ';' to split multiple vars)
  -r, --remote=<value>  git remote of app to use
  -s, --size=<value>    dyno size
  -t, --tail            continually stream logs
      --type=<value>    process type

DESCRIPTION
  run a detached dyno, where output is sent to your logs

EXAMPLES
  $ heroku run:detached ls
```

_See code: [src/commands/run/detached.ts](https://github.com/heroku/cli/blob/v10.0.2/packages/cli/src/commands/run/detached.ts)_

## `heroku run:inside DYNO_NAME COMMAND`

run a command inside an existing dyno (for Fir-generation apps only)

```
USAGE
  $ heroku run:inside DYNO_NAME... COMMAND... -a <value> [-x] [--no-launcher] [-r <value>]

ARGUMENTS
  DYNO_NAME...  name of the dyno to run command inside
  COMMAND...    command to run (Heroku automatically prepends ‘launcher’ to the command)

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -x, --exit-code       passthrough the exit code of the remote command
      --no-launcher     don’t prepend ‘launcher’ before a command

DESCRIPTION
  run a command inside an existing dyno (for Fir-generation apps only)

EXAMPLES
  Run bash

    $ heroku run:inside web-848cd4f64d-pvpr2 bash -a my-app

  Run a command supplied by a script taking option flags

    $ heroku run:inside web-848cd4f64d-pvpr2 -a my-app -- myscript.sh -x --log-level=warn

  Run a command declared for the worker process type in a Procfile

    $ heroku run:inside web-848cd4f64d-pvpr2 worker -a my-app
```

_See code: [src/commands/run/inside.ts](https://github.com/heroku/cli/blob/v10.0.2/packages/cli/src/commands/run/inside.ts)_
