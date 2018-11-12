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
* [`heroku local [PROCESSNAME]`](#heroku-local-processname)
* [`heroku local:run`](#heroku-localrun)
* [`heroku local:version`](#heroku-localversion)

## `heroku local [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ heroku local [PROCESSNAME]

OPTIONS
  -e, --env=env            location of env file (defaults to .env)
  -f, --procfile=procfile  use a different Procfile
  -p, --port=port          port to listen on

DESCRIPTION
  Start the application specified by a Procfile (defaults to ./Procfile)

ALIASES
  $ heroku local:start

EXAMPLES
  $ heroku local
  $ heroku local web
  $ heroku local web=2
  $ heroku local web=1,worker=2
```

## `heroku local:run`

run a one-off command

```
USAGE
  $ heroku local:run

OPTIONS
  -e, --env=env
  -p, --port=port

EXAMPLES
  $ heroku local:run bin/migrate
```

_See code: [lib/commands/local/run.js](https://github.com/heroku/cli/blob/v7.18.6/packages/local-v5/lib/commands/local/run.js)_

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version
```

_See code: [lib/commands/local/version.js](https://github.com/heroku/cli/blob/v7.18.6/packages/local-v5/lib/commands/local/version.js)_
<!-- commandsstop -->
