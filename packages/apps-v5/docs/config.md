`heroku config`
===============

set one or more config vars

* [`heroku config:set`](#heroku-configset)
* [`heroku config:unset`](#heroku-configunset)

## `heroku config:set`

set one or more config vars

```
USAGE
  $ heroku config:set

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku config:set RAILS_ENV=staging
  Setting config vars and restarting example... done, v10
  RAILS_ENV: staging

  $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
  Setting config vars and restarting example... done, v11
  RAILS_ENV: staging
  RACK_ENV:  staging
```

## `heroku config:unset`

unset one or more config vars

```
USAGE
  $ heroku config:unset

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku config:unset RAILS_ENV
  Unsetting RAILS_ENV and restarting example... done, v10

  $ heroku config:unset RAILS_ENV RACK_ENV
  Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10
```
