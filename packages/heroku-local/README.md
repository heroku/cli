heroku-local [![Circle CI](https://circleci.com/gh/heroku/heroku-local/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-local/tree/master)
============

[![Code Climate](https://codeclimate.com/github/heroku/heroku-local/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-local)
[![npm version](https://badge.fury.io/js/heroku-local.svg)](https://badge.fury.io/js/heroku-local)
[![License](https://img.shields.io/github/license/heroku/heroku-local.svg)](https://github.com/heroku/heroku-local/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Run heroku apps locally. This plugin is built into the Heroku Toolbelt, you do not need to install it separately.

To use:

```
$ heroku local
12:47:17 PM web.1 | listening on 3000
```

This command internally uses [node-foreman](https://github.com/strongloop/node-foreman) to run the app locally.

Commands
========

<!-- commands -->
* [`@heroku-cli/plugin-local local [PROCESSNAME]`](#heroku-cli-plugin-local-local-processname)
* [`@heroku-cli/plugin-local local:run`](#heroku-cli-plugin-local-localrun)
* [`@heroku-cli/plugin-local local:start [PROCESSNAME]`](#heroku-cli-plugin-local-localstart-processname)
* [`@heroku-cli/plugin-local local:version`](#heroku-cli-plugin-local-localversion)

## `@heroku-cli/plugin-local local [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ @heroku-cli/plugin-local local [PROCESSNAME]

OPTIONS
  -e, --env=env            location of env file (defaults to .env)
  -f, --procfile=procfile  use a different Procfile
  -p, --port=port          port to listen on

DESCRIPTION
  Start the application specified by a Procfile (defaults to ./Procfile)

  Examples:

       heroku local
       heroku local web
       heroku local web=2
       heroku local web=1,worker=2
```

## `@heroku-cli/plugin-local local:run`

run a one-off command

```
USAGE
  $ @heroku-cli/plugin-local local:run

OPTIONS
  -e, --env=env
  -p, --port=port

DESCRIPTION
  Example:

       heroku local:run bin/migrate
```

## `@heroku-cli/plugin-local local:start [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ @heroku-cli/plugin-local local:start [PROCESSNAME]

OPTIONS
  -e, --env=env            location of env file (defaults to .env)
  -f, --procfile=procfile  use a different Procfile
  -p, --port=port          port to listen on

DESCRIPTION
  Start the application specified by a Procfile (defaults to ./Procfile)

  Examples:

       heroku local
       heroku local web
       heroku local web=2
       heroku local web=1,worker=2
```

## `@heroku-cli/plugin-local local:version`

display node-foreman version

```
USAGE
  $ @heroku-cli/plugin-local local:version

DESCRIPTION
  Display node-foreman version
```
<!-- commandsstop -->
