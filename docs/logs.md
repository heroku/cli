`heroku logs`
=============

display recent log output

* [`heroku logs`](#heroku-logs)

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

_See code: [@heroku-cli/plugin-run](https://github.com/heroku/cli/blob/v7.41.1/src/commands/logs.ts)_
