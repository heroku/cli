`heroku config`
===============

environment variables of apps

* [`heroku config`](#heroku-config)
* [`heroku config:edit [KEY]`](#heroku-configedit-key)
* [`heroku config:get KEY...`](#heroku-configget-key)
* [`heroku config:remove`](#heroku-configremove)
* [`heroku config:set`](#heroku-configset)
* [`heroku config:unset`](#heroku-configunset)

## `heroku config`

display the config vars for an app

```
USAGE
  $ heroku config -a <value> [-r <value>] [-s] [-j]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -j, --json            output config vars in json format
  -r, --remote=<value>  git remote of app to use
  -s, --shell           output config vars in shell format

DESCRIPTION
  display the config vars for an app
```

_See code: [src/commands/config/index.ts](https://github.com/heroku/cli/blob/v9.3.0-beta.1/packages/cli/src/commands/config/index.ts)_

## `heroku config:edit [KEY]`

interactively edit config vars

```
USAGE
  $ heroku config:edit [KEY] -a <value> [-r <value>]

ARGUMENTS
  KEY  edit a single key

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  interactively edit config vars
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

_See code: [src/commands/config/edit.ts](https://github.com/heroku/cli/blob/v9.3.0-beta.1/packages/cli/src/commands/config/edit.ts)_

## `heroku config:get KEY...`

display a single config value for an app

```
USAGE
  $ heroku config:get KEY...

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --shell           output config vars in shell format

DESCRIPTION
  display a single config value for an app

EXAMPLES
  $ heroku config:get RAILS_ENV
  production
```

_See code: [src/commands/config/get.ts](https://github.com/heroku/cli/blob/v9.3.0-beta.1/packages/cli/src/commands/config/get.ts)_

## `heroku config:remove`

unset one or more config vars

```
USAGE
  $ heroku config:remove -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  unset one or more config vars

ALIASES
  $ heroku config:remove

EXAMPLES
  $ heroku config:unset RAILS_ENV
  Unsetting RAILS_ENV and restarting example... done, v10

  $ heroku config:unset RAILS_ENV RACK_ENV
  Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10
```

## `heroku config:set`

set one or more config vars

```
USAGE
  $ heroku config:set -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set one or more config vars

EXAMPLES
  $ heroku config:set RAILS_ENV=staging
  Setting config vars and restarting example... done, v10
  RAILS_ENV: staging
  $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
  Setting config vars and restarting example... done, v11
  RAILS_ENV: staging
  RACK_ENV:  staging
```

_See code: [src/commands/config/set.ts](https://github.com/heroku/cli/blob/v9.3.0-beta.1/packages/cli/src/commands/config/set.ts)_

## `heroku config:unset`

unset one or more config vars

```
USAGE
  $ heroku config:unset -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  unset one or more config vars

ALIASES
  $ heroku config:remove

EXAMPLES
  $ heroku config:unset RAILS_ENV
  Unsetting RAILS_ENV and restarting example... done, v10

  $ heroku config:unset RAILS_ENV RACK_ENV
  Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10
```

_See code: [src/commands/config/unset.ts](https://github.com/heroku/cli/blob/v9.3.0-beta.1/packages/cli/src/commands/config/unset.ts)_
