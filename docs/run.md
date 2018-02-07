heroku run
==========

run a one-off process inside a Heroku dyno
# Commands

* [heroku run [OPTIONS]](#run)
* [heroku run:detached [OPTIONS]](#rundetached)
## run

run a one-off process inside a heroku dyno

```
USAGE
  $ heroku run [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -e, --env=env        environment variables to set (use ';' to split multiple vars)
  -r, --remote=remote  git remote of app to use
  -s, --size=size      dyno size
  -x, --exit-code      passthrough the exit code of the remote command
  --no-tty             force the command to not run in a tty
  --type=type          process type

DESCRIPTION
  Examples:

       $ heroku run bash
       Running bash on app.... up, run.1
       ~ $

       $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
       Running myscript.sh -a arg1 -s arg2 on app.... up, run.1
```

### run:detached

run a detached dyno, where output is sent to your logs

```
USAGE
  $ heroku run:detached [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -e, --env=env        environment variables to set (use ';' to split multiple vars)
  -r, --remote=remote  git remote of app to use
  -s, --size=size      dyno size
  -t, --tail           stream logs from the dyno
  --type=type          process type

DESCRIPTION
  Example:

       $ heroku run:detached ls
       Running ls on app [detached]... up, run.1
       Run heroku logs -a app -p run.1 to view the output.
```
