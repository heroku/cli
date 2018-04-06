heroku config
=============

display a config value for an app
Example:

    $ heroku config:get RAILS_ENV
    production
 
* [heroku config](#heroku-config)
* [heroku config:get KEY](#heroku-configget-key)
* [heroku config:set](#heroku-configset)
* [heroku config:unset](#heroku-configunset)

## heroku config

display the config vars for an app

```
USAGE
  $ heroku config

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format
  --json               output config vars in json format
```

### heroku config:get KEY

display a config value for an app

```
USAGE
  $ heroku config:get KEY

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config var in shell format

DESCRIPTION
  Example:

       $ heroku config:get RAILS_ENV
       production
```

### heroku config:set

set one or more config vars

```
USAGE
  $ heroku config:set

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

### heroku config:unset

unset one or more config vars

```
USAGE
  $ heroku config:unset

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

## heroku config:get KEY

display a config value for an app

```
USAGE
  $ heroku config:get KEY

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config var in shell format

DESCRIPTION
  Example:

       $ heroku config:get RAILS_ENV
       production
```

## heroku config:set

set one or more config vars

```
USAGE
  $ heroku config:set

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

## heroku config:unset

unset one or more config vars

```
USAGE
  $ heroku config:unset

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
