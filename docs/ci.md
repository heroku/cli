`heroku ci`
===========

run an application test suite on Heroku

* [`heroku ci`](#heroku-ci)
* [`heroku ci:config`](#heroku-ciconfig)
* [`heroku ci:config:get KEY`](#heroku-ciconfigget-key)
* [`heroku ci:config:set`](#heroku-ciconfigset)
* [`heroku ci:config:unset`](#heroku-ciconfigunset)
* [`heroku ci:debug`](#heroku-cidebug)
* [`heroku ci:info NUMBER`](#heroku-ciinfo-number)
* [`heroku ci:last`](#heroku-cilast)
* [`heroku ci:migrate-manifest`](#heroku-cimigrate-manifest)
* [`heroku ci:open`](#heroku-ciopen)
* [`heroku ci:rerun [NUMBER]`](#heroku-cirerun-number)
* [`heroku ci:run`](#heroku-cirun)

## `heroku ci`

show the most recent runs

```
USAGE
  $ heroku ci

OPTIONS
  -a, --app=app            app to run command against
  -j, --json               output run info in json format
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  -w, --watch              keep running and watch for new and update tests

DESCRIPTION
  display the most recent CI runs for the given pipeline

     Example:

       $ heroku ci --app murmuring-headland-14719
```

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

## `heroku ci:info NUMBER`

test run information

```
USAGE
  $ heroku ci:info NUMBER

ARGUMENTS
  NUMBER  the test run number to show

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  show the status of a specific test run

     Example:

       $ heroku ci:info 1288 --app murmuring-headland-14719
```

## `heroku ci:last`

get the results of the last run

```
USAGE
  $ heroku ci:last

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  looks for the most recent run and returns the output of that run

     Example:

     $ heroku ci:last --app murmuring-headland-14719
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

## `heroku ci:rerun [NUMBER]`

rerun tests against current directory

```
USAGE
  $ heroku ci:rerun [NUMBER]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  uploads the contents of the current directory, using git archive, to Heroku and runs the tests

     Example:

       $ heroku ci:rerun 985 --app murmuring-headland-14719
```

## `heroku ci:run`

run tests against current directory

```
USAGE
  $ heroku ci:run

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  uploads the contents of the current directory to Heroku and runs the tests

     Example:

       $ heroku ci:run --app murmuring-headland-14719
```
