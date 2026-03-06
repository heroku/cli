`heroku maintenance`
====================

enable/disable access to app

* [`heroku maintenance`](#heroku-maintenance)
* [`heroku maintenance:off`](#heroku-maintenanceoff)
* [`heroku maintenance:on`](#heroku-maintenanceon)

## `heroku maintenance`

display the current maintenance status of app

```
USAGE
  $ heroku maintenance -a <value> [--prompt] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display the current maintenance status of app
```

_See code: [src/commands/maintenance/index.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.37/src/commands/maintenance/index.ts)_

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off -a <value> [--prompt] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  take the app out of maintenance mode
```

_See code: [src/commands/maintenance/off.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.37/src/commands/maintenance/off.ts)_

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on -a <value> [--prompt] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  put the app into maintenance mode
```

_See code: [src/commands/maintenance/on.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.37/src/commands/maintenance/on.ts)_
