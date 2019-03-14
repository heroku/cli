`heroku local`
==============

run heroku app locally

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

_See code: [@heroku-cli/plugin-local-v5](https://github.com/heroku/cli/blob/v7.22.6/packages/local-v5/lib/commands/local/run.js)_

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version
```

_See code: [@heroku-cli/plugin-local-v5](https://github.com/heroku/cli/blob/v7.22.6/packages/local-v5/lib/commands/local/version.js)_
