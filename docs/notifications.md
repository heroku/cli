`heroku notifications`
======================

display notifications

* [`heroku notifications`](#heroku-notifications)

## `heroku notifications`

display notifications

```
USAGE
  $ heroku notifications [-a <value>] [-r <value>] [--all] [--json] [--read]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --all             view all notifications (not just the ones for the current app)
      --json            output in json format
      --read            show notifications already read

DESCRIPTION
  display notifications
```

_See code: [src/commands/notifications/index.ts](https://github.com/heroku/cli/blob/v10.7.0-alpha.0/packages/cli/src/commands/notifications/index.ts)_
