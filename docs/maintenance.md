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
  $ heroku maintenance -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  display the current maintenance status of app
```

_See code: [src/commands/maintenance/index.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/maintenance/index.ts)_

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  take the app out of maintenance mode
```

_See code: [src/commands/maintenance/off.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/maintenance/off.ts)_

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  put the app into maintenance mode
```

_See code: [src/commands/maintenance/on.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/maintenance/on.ts)_
