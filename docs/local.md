heroku local
============


# Commands

* [heroku local [PROCESSNAME] [OPTIONS]](#local)
* [heroku local:run [OPTIONS]](#localrun)
* [heroku local:start [PROCESSNAME] [OPTIONS]](#localstart)
* [heroku local:version](#localversion)
## local

run heroku app locally

```
USAGE
  $ heroku local [PROCESSNAME] [OPTIONS]

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

### local:run

run a one-off command

```
USAGE
  $ heroku local:run [OPTIONS]

OPTIONS
  -e, --env=env
  -p, --port=port

DESCRIPTION
  Example:

       heroku local:run bin/migrate
```

### local:start

run heroku app locally

```
USAGE
  $ heroku local:start [PROCESSNAME] [OPTIONS]

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

### local:version

display node-foreman version

```
USAGE
  $ heroku local:version

DESCRIPTION
  Display node-foreman version
```
