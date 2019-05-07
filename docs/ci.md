`heroku ci`
===========

run an application test suite on Heroku

* [`heroku ci:config`](#heroku-ciconfig)
* [`heroku ci:config:get KEY`](#heroku-ciconfigget-key)
* [`heroku ci:config:set`](#heroku-ciconfigset)
* [`heroku ci:config:unset`](#heroku-ciconfigunset)
* [`heroku ci:debug`](#heroku-cidebug)
* [`heroku ci:migrate-manifest`](#heroku-cimigrate-manifest)
* [`heroku ci:open`](#heroku-ciopen)

## `heroku ci:config`

display CI config vars

```
USAGE
  $ heroku ci:config

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  -s, --shell              output config vars in shell format
  --json                   output config vars in json format

DESCRIPTION
  Example:

       $ heroku ci:config --app murmuring-headland-14719 --json
```

## `heroku ci:config:get KEY`

get a CI config var

```
USAGE
  $ heroku ci:config:get KEY

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  -s, --shell              output config var in shell format

DESCRIPTION
  Examples:

       $ heroku ci:config:get RAILS_ENV
       test
```

## `heroku ci:config:set`

set CI config vars

```
USAGE
  $ heroku ci:config:set

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  Examples:

       $ heroku ci:config:set RAILS_ENV=test
       Setting test config vars... done

       RAILS_ENV: test
```

## `heroku ci:config:unset`

unset CI config vars

```
USAGE
  $ heroku ci:config:unset

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  Examples:

       $ heroku ci:config:uset RAILS_ENV
       Unsetting RAILS_ENV... done
```

## `heroku ci:debug`

opens an interactive test debugging session with the contents of the current directory

```
USAGE
  $ heroku ci:debug

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  --no-cache               start test run with an empty cache
  --no-setup               start test dyno without running test-setup

DESCRIPTION
  Example:

       $ heroku ci:debug
       Preparing source... done
       Creating test run... done
       Running setup and attaching to test dyno...

  ~ $
```

## `heroku ci:migrate-manifest`

app-ci.json is deprecated. Run this command to migrate to app.json with an environments key.

```
USAGE
  $ heroku ci:migrate-manifest

DESCRIPTION
  Example:

       $ heroku ci:migrate-manifest
       Writing app.json file... done
       Deleting app-ci.json file... done
       Please check the contents of your app.json before committing to your repo
       You're all set! 🎉.
```

## `heroku ci:open`

open the Dashboard version of Heroku CI

```
USAGE
  $ heroku ci:open

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  opens a browser to view the Dashboard version of Heroku CI

       Example:

       $ heroku ci:open --app murmuring-headland-14719
```
