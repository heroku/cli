heroku ci
=========


# Commands

* [heroku ci [OPTIONS]](#ci)
* [heroku ci:config [OPTIONS]](#ciconfig)
* [heroku ci:config:get KEY [OPTIONS]](#ciconfigget)
* [heroku ci:config:set [OPTIONS]](#ciconfigset)
* [heroku ci:config:unset [OPTIONS]](#ciconfigunset)
* [heroku ci:debug [OPTIONS]](#cidebug)
* [heroku ci:info NUMBER [OPTIONS]](#ciinfo)
* [heroku ci:last [OPTIONS]](#cilast)
* [heroku ci:migrate-manifest](#cimigrate-manifest)
* [heroku ci:open [OPTIONS]](#ciopen)
* [heroku ci:rerun [NUMBER] [OPTIONS]](#cirerun)
* [heroku ci:run [OPTIONS]](#cirun)
## ci

show the most recent runs

```
USAGE
  $ heroku ci [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -j, --json               output run info in json format
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  -w, --watch              keep running and watch for new and update tests

DESCRIPTION
  display the most recent CI runs for the given pipeline
```

### ci:config

display CI config vars

```
USAGE
  $ heroku ci:config [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use
  -s, --shell              output config vars in shell format
  --json                   output config vars in json format
```

#### ci:config:get

get a CI config var

```
USAGE
  $ heroku ci:config:get KEY [OPTIONS]

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

#### ci:config:set

set CI config vars

```
USAGE
  $ heroku ci:config:set [OPTIONS]

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

#### ci:config:unset

unset CI config vars

```
USAGE
  $ heroku ci:config:unset [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  Examples:

       $ heroku ci:config:uset RAILS_ENV
       Unsetting RAILS_ENV... done
```

### ci:config:get

get a CI config var

```
USAGE
  $ heroku ci:config:get KEY [OPTIONS]

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

### ci:config:set

set CI config vars

```
USAGE
  $ heroku ci:config:set [OPTIONS]

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

### ci:config:unset

unset CI config vars

```
USAGE
  $ heroku ci:config:unset [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  Examples:

       $ heroku ci:config:uset RAILS_ENV
       Unsetting RAILS_ENV... done
```

### ci:debug

opens an interactive test debugging session with the contents of the current directory

```
USAGE
  $ heroku ci:debug [OPTIONS]

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

### ci:info

test run information

```
USAGE
  $ heroku ci:info NUMBER [OPTIONS]

ARGUMENTS
  NUMBER  the test run number to show

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  show the status of a specific test run
```

### ci:last

get the results of the last run

```
USAGE
  $ heroku ci:last [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  looks for the most recent run and returns the output of that run
```

### ci:migrate-manifest

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

### ci:open

open the Dashboard version of Heroku CI

```
USAGE
  $ heroku ci:open [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  opens a browser to view the Dashboard version of Heroku CI
```

### ci:rerun

rerun tests against current directory

```
USAGE
  $ heroku ci:rerun [NUMBER] [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  uploads the contents of the current directory, using git archive, to Heroku and runs the tests
```

### ci:run

run tests against current directory

```
USAGE
  $ heroku ci:run [OPTIONS]

OPTIONS
  -a, --app=app            app to run command against
  -p, --pipeline=pipeline  pipeline
  -r, --remote=remote      git remote of app to use

DESCRIPTION
  uploads the contents of the current directory to Heroku and runs the tests
```
