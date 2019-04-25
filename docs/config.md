`heroku config`
===============

environment variables of apps

* [`heroku config`](#heroku-config)
* [`heroku config:edit [KEY]`](#heroku-configedit-key)
* [`heroku config:get KEY...`](#heroku-configget-key)
* [`heroku config:set`](#heroku-configset)
* [`heroku config:unset`](#heroku-configunset)

## `heroku config`

display the config vars for an app

```
USAGE
  $ heroku config

OPTIONS
  -a, --app=app        (required) app to run command against
  -j, --json           output config vars in json format
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format
```

_See code: [@heroku-cli/plugin-config](https://github.com/heroku/cli/blob/v7.24.0/packages/config/src/commands/config/index.ts)_

## `heroku config:edit [KEY]`

interactively edit config vars

```
USAGE
  $ heroku config:edit [KEY]

ARGUMENTS
  KEY  edit a single key

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  This command opens the app config in a text editor set by $VISUAL or $EDITOR.
  Any variables added/removed/changed will be updated on the app after saving and closing the file.

EXAMPLES
  # edit with vim
  $ EDITOR="vim" heroku config:edit
  # edit with emacs
  $ EDITOR="emacs" heroku config:edit
  # edit with pico
  $ EDITOR="pico" heroku config:edit
  # edit with atom editor
  $ VISUAL="atom --wait" heroku config:edit
```

_See code: [@heroku-cli/plugin-config](https://github.com/heroku/cli/blob/v7.24.0/packages/config/src/commands/config/edit.ts)_

## `heroku config:get KEY...`

display a single config value for an app

```
USAGE
  $ heroku config:get KEY...

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output config vars in shell format

EXAMPLES
  $ heroku config:get RAILS_ENV
  production
```

_See code: [@heroku-cli/plugin-config](https://github.com/heroku/cli/blob/v7.24.0/packages/config/src/commands/config/get.ts)_

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

ALIASES
  $ heroku config:remove

EXAMPLES
  $ heroku config:unset RAILS_ENV
  Unsetting RAILS_ENV and restarting example... done, v10
  $ heroku config:unset RAILS_ENV RACK_ENV
  Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10
```

_See code: [@heroku-cli/plugin-config](https://github.com/heroku/cli/blob/v7.24.0/packages/config/src/commands/config/unset.ts)_
