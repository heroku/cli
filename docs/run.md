`heroku run`
============

run a one-off process inside a Heroku dyno

* [`heroku run`](#heroku-run)
* [`heroku run:detached`](#heroku-rundetached)

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

  $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
  Running myscript.sh -a arg1 -s arg2 on app.... up, run.1
```

_See code: [@heroku-cli/plugin-run-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/run-v5/commands/run.js)_

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

_See code: [@heroku-cli/plugin-run-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/run-v5/commands/run/detached.js)_
