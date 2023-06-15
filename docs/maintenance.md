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
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  display the current maintenance status of app
```

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  take the app out of maintenance mode
```

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  put the app into maintenance mode
```
