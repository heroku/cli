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

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/index.js)_

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

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/off.js)_

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

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/on.js)_
