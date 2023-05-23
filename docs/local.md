`heroku local`
==============

run Heroku app locally

* [`heroku local [PROCESSNAME]`](#heroku-local-processname)
* [`heroku local:run`](#heroku-localrun)
* [`heroku local:start [PROCESSNAME]`](#heroku-localstart-processname)
* [`heroku local:version`](#heroku-localversion)

## `heroku local [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ heroku local [PROCESSNAME] [-f <value>] [-e <value>] [-p <value>]

FLAGS
  -e, --env=<value>       location of env file (defaults to .env)
  -f, --procfile=<value>  use a different Procfile
  -p, --port=<value>      port to listen on

DESCRIPTION
  run heroku app locally
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
  $ heroku local:run [-e <value>] [-p <value>]

FLAGS
  -e, --env=<value>
  -p, --port=<value>  [default: 5001]

DESCRIPTION
  run a one-off command

EXAMPLES
  $ heroku local:run bin/migrate
```

## `heroku local:start [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ heroku local:start [PROCESSNAME] [-f <value>] [-e <value>] [-p <value>]

FLAGS
  -e, --env=<value>       location of env file (defaults to .env)
  -f, --procfile=<value>  use a different Procfile
  -p, --port=<value>      port to listen on

DESCRIPTION
  run heroku app locally
  Start the application specified by a Procfile (defaults to ./Procfile)

ALIASES
  $ heroku local:start

EXAMPLES
  $ heroku local
  $ heroku local web
  $ heroku local web=2
  $ heroku local web=1,worker=2
```

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version

DESCRIPTION
  display node-foreman version
```
