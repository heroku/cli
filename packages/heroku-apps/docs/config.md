heroku config
=============

Heroku CLI plugin to manage apps.
# Commands

* [heroku config [OPTIONS]](#config)
* [heroku config:get KEY [OPTIONS]](#configget)
* [heroku config:set [OPTIONS]](#configset)
* [heroku config:unset [OPTIONS]](#configunset)
## config

display the config vars for an app

```
USAGE
  $ heroku config [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format
  --json               output config vars in json format
```

### config:get

display a config value for an app

```
USAGE
  $ heroku config:get KEY [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config var in shell format

DESCRIPTION
  Example:

       $ heroku config:get RAILS_ENV
       production
```

### config:set

set one or more config vars

```
USAGE
  $ heroku config:set [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Examples:

       $ heroku config:set RAILS_ENV=staging
       Setting config vars and restarting example... done, v10
       RAILS_ENV: staging
    
       $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
       Setting config vars and restarting example... done, v11
       RAILS_ENV: staging
       RACK_ENV:  staging
```

### config:unset

unset one or more config vars

```
USAGE
  $ heroku config:unset [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  Examples:

       $ heroku config:unset RAILS_ENV
       Unsetting RAILS_ENV and restarting example... done, v10
    
       $ heroku config:unset RAILS_ENV RACK_ENV
       Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10
```
