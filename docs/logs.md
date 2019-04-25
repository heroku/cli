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
  $ heroku logs
  2012-01-01T12:00:00+00:00 heroku[api]: Config add EXAMPLE by email@example.com
  2012-01-01T12:00:01+00:00 heroku[api]: Release v1 created by email@example.com
```

_See code: [@heroku-cli/plugin-run-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/run-v5/commands/logs.js)_
