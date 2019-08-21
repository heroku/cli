`heroku local`
==============

run Heroku app locally

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

EXAMPLE
  $ heroku local
  $ heroku local web
  $ heroku local web=2
  $ heroku local web=1,worker=2
```

_See code: [@heroku-cli/plugin-local](https://github.com/heroku/cli/blob/v7.28.0/src/commands/local/index.ts)_

## `heroku local:run`

run a one-off command

```
USAGE
  $ heroku local:run

OPTIONS
  -e, --env=env
  -p, --port=port

EXAMPLE
  $ heroku local:run bin/migrate
```

_See code: [@heroku-cli/plugin-local](https://github.com/heroku/cli/blob/v7.28.0/src/commands/local/run.ts)_

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version
```

_See code: [@heroku-cli/plugin-local](https://github.com/heroku/cli/blob/v7.28.0/src/commands/local/version.ts)_
