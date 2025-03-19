`heroku logs`
=============

display recent log output

* [`heroku logs`](#heroku-logs)

## `heroku logs`

display recent log output

```
USAGE
  $ heroku logs -a <value> [-d <value>] [--force-colors] [-n <value>] [-r <value>] [-s <value>] [-t] [-p
    <value>]

FLAGS
  -a, --app=<value>           (required) app to run command against
  -d, --dyno-name=<value>     only show output from this dyno (such as "web-123-456" or "worker.2")
  -n, --num=<value>           number of lines to display (ignored for Fir generation apps)
  -p, --process-type=<value>  only show output from this process type (such as "web" or "worker")
  -r, --remote=<value>        git remote of app to use
  -s, --source=<value>        only show output from this source (such as "app" or "heroku")
  -t, --tail                  continually stream logs (always enabled for Fir-generation apps)
      --force-colors          force use of colors (even on non-tty output)

DESCRIPTION
  display recent log output
  disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0


EXAMPLES
  $ heroku logs --app=my-app

  $ heroku logs --num=50 --app=my-app

  $ heroku logs --dyno-name=web-123-456 --app=my-app

  $ heroku logs --process-type=web --app=my-app

  $ heroku logs --app=my-app --tail
```

_See code: [src/commands/logs.ts](https://github.com/heroku/cli/blob/v10.3.1-alpha.0/packages/cli/src/commands/logs.ts)_
