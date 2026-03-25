`heroku notifications`
======================

display notifications

* [`heroku notifications`](#heroku-notifications)

## `heroku notifications`

display notifications

```
USAGE
  $ heroku notifications [--prompt] [--all] [-a <value>] [--json] [--read] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --all             view all notifications (not just the ones for the current app)
      --json            output in json format
      --read            show notifications already read

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display notifications
```

_See code: [src/commands/notifications/index.ts](https://github.com/heroku/cli/blob/v11.0.2-alpha.0/src/commands/notifications/index.ts)_
