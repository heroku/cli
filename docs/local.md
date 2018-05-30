`heroku local`
==============

run heroku app locally
* [`heroku local [PROCESSNAME]`](#heroku-local-processname)
* [`heroku local:run`](#heroku-localrun)
* [`heroku local:start [PROCESSNAME]`](#heroku-localstart-processname)
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

  Examples:

       heroku local
       heroku local web
       heroku local web=2
       heroku local web=1,worker=2
```

## `heroku local:run`

run a one-off command

```
USAGE
  $ heroku local:run

OPTIONS
  -e, --env=env
  -p, --port=port

DESCRIPTION
  Example:

       heroku local:run bin/migrate
```

## `heroku local:start [PROCESSNAME]`

run heroku app locally

```
USAGE
  $ heroku local:start [PROCESSNAME]

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

## `heroku local:version`

display node-foreman version

```
USAGE
  $ heroku local:version

DESCRIPTION
  Display node-foreman version
```
