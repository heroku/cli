`heroku run`
============

run a one-off process inside a Heroku dyno

* [`heroku run`](#heroku-run)
* [`heroku run:detached`](#heroku-rundetached)
* [`heroku run:inside COMMAND DYNO_NAME`](#heroku-runinside-command-dyno_name)

## `heroku run`

run a one-off process inside a heroku dyno

```
USAGE
  $ heroku run -a <value> [-e <value>] [-x] [--no-launcher] [--no-notify] [--no-tty] [-r <value>] [-s
    <value>] [--type <value>]

FLAGS
  -a, --app=<value>     (required) parent app used by review apps
  -e, --env=<value>     environment variables to set (use ';' to split multiple vars)
  -r, --remote=<value>  git remote of app to use
  -s, --size=<value>    dyno size
  -x, --exit-code       passthrough the exit code of the remote command
      --no-launcher     don't prepend 'launcher' before a command
      --no-notify       disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)
      --no-tty          force the command to not run in a tty
      --type=<value>    process type

DESCRIPTION
  run a one-off process inside a heroku dyno
  Shows a notification if the dyno takes more than 20 seconds to start.
  Heroku automatically prepends 'launcher' to the command on CNB apps (use --no-launcher to disable).

EXAMPLES
   $ heroku run bash 

   $ heroku run -s standard-2x -- myscript.sh -a arg1 -s arg2
```

_See code: [src/commands/run/index.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.15/packages/cli/src/commands/run/index.ts)_

## `heroku run:detached`

run a detached dyno, where output is sent to your logs

```
USAGE
  $ heroku run:detached -a <value> [-e <value>] [--no-launcher] [-r <value>] [-s <value>] [-t] [--type <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -e, --env=<value>     environment variables to set (use ';' to split multiple vars)
  -r, --remote=<value>  git remote of app to use
  -s, --size=<value>    dyno size
  -t, --tail            continually stream logs
      --no-launcher     don't prepend 'launcher' before a command
      --type=<value>    process type

DESCRIPTION
  run a detached dyno, where output is sent to your logs

EXAMPLES
   $ heroku run:detached ls
```

_See code: [src/commands/run/detached.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.15/packages/cli/src/commands/run/detached.ts)_

## `heroku run:inside COMMAND DYNO_NAME`

run a command inside an existing dyno (for Fir-generation apps only)

```
USAGE
  $ heroku run:inside COMMAND... DYNO_NAME... -a <value> [-x] [--no-launcher] [-r <value>]

ARGUMENTS
  COMMAND...    command to run (Heroku automatically prepends 'launcher' to the command)
  DYNO_NAME...  name of the dyno to run command inside

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -x, --exit-code       passthrough the exit code of the remote command
      --no-launcher     don't prepend 'launcher' before a command

DESCRIPTION
  run a command inside an existing dyno (for Fir-generation apps only)

EXAMPLES
  # Run bash
   $ heroku run:inside web-848cd4f64d-pvpr2 bash -a my-app 

  # Run a command supplied by a script taking option flags
   $ heroku run:inside web-848cd4f64d-pvpr2 -a my-app -- myscript.sh -x --log-level=warn 

  # Run a command declared for the worker process type in a Procfile
   $ heroku run:inside web-848cd4f64d-pvpr2 worker -a my-app
```

_See code: [src/commands/run/inside.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.15/packages/cli/src/commands/run/inside.ts)_
