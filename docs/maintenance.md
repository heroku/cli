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
  $ heroku maintenance

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
