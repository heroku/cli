`heroku logs`
=============

display recent log output

* [`heroku logs`](#heroku-logs)

## `heroku logs`

display recent log output

```
USAGE
  $ heroku logs -a <value> [-r <value>] [-n <value>] [-d <value>] [-s <value>] [-t] [--force-colors]

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -d, --dyno=<value>    only show output from this dyno type (such as "web" or "worker")
  -n, --num=<value>     number of lines to display
  -r, --remote=<value>  git remote of app to use
  -s, --source=<value>  only show output from this source (such as "app" or "heroku")
  -t, --tail            continually stream logs
  --force-colors        force use of colors (even on non-tty output)

DESCRIPTION
  display recent log output
  disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0

EXAMPLES
  $ heroku logs --app=my-app

  $ heroku logs --num=50

  $ heroku logs --dyno=web --app=my-app

  $ heroku logs --app=my-app --tail
```
