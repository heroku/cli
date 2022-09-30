`heroku container`
==================

Use containers to build and deploy Heroku apps

* [`heroku container`](#heroku-container)
* [`heroku container:login`](#heroku-containerlogin)
* [`heroku container:logout`](#heroku-containerlogout)
* [`heroku container:pull`](#heroku-containerpull)
* [`heroku container:push`](#heroku-containerpush)
* [`heroku container:release`](#heroku-containerrelease)
* [`heroku container:rm`](#heroku-containerrm)
* [`heroku container:run`](#heroku-containerrun)

## `heroku container`

Use containers to build and deploy Heroku apps

```
Use containers to build and deploy Heroku apps


USAGE
  $ heroku container
```

## `heroku container:login`

log in to Heroku Container Registry

```
log in to Heroku Container Registry
Usage:
        heroku container:login

USAGE
  $ heroku container:login

OPTIONS
  -v, --verbose

DESCRIPTION
  Usage:
           heroku container:login
```

## `heroku container:logout`

log out from Heroku Container Registry

```
log out from Heroku Container Registry


USAGE
  $ heroku container:logout

OPTIONS
  -v, --verbose
```

## `heroku container:pull`

pulls an image from an app's process type

```
pulls an image from an app's process type

    [1m[4m[35mUsage:[39m[24m[22m
    [36m[1mheroku container:pull web[22m[39m        # Pulls the web image from the app
    [36m[1mheroku container:pull web worker[22m[39m # Pulls both the web and worker images from the app
    [36m[1mheroku container:pull web:latest[22m[39m # Pulls the latest tag from the web image

USAGE
  $ heroku container:pull

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -v, --verbose

DESCRIPTION
  Usage:
       heroku container:pull web        # Pulls the web image from the app
       heroku container:pull web worker # Pulls both the web and worker images from the app
       heroku container:pull web:latest # Pulls the latest tag from the web image
```

## `heroku container:push`

builds, then pushes Docker images to deploy your Heroku app

```
builds, then pushes Docker images to deploy your Heroku app


USAGE
  $ heroku container:push

OPTIONS
  -R, --recursive              pushes Dockerfile.<process> found in current and subdirectories
  -a, --app=app                (required) app to run command against
  -r, --remote=remote          git remote of app to use
  -v, --verbose
  --arg=arg                    set build-time variables
  --context-path=context-path  path to use as build context (defaults to Dockerfile dir)

EXAMPLES
  heroku container:push web                          # Pushes Dockerfile to web process type
  heroku container:push worker                       # Pushes Dockerfile to worker process type
  heroku container:push web worker --recursive       # Pushes Dockerfile.web and Dockerfile.worker
  heroku container:push --recursive                  # Pushes Dockerfile.*
  heroku container:push web --arg ENV=live,HTTPS=on  # Build-time variables
  heroku container:push --recursive --context-path . # Pushes Dockerfile.* using current dir as build context
```

## `heroku container:release`

Releases previously pushed Docker images to your Heroku app

```
Releases previously pushed Docker images to your Heroku app

    [1m[4m[35mUsage:[39m[24m[22m
    [36m[1mheroku container:release web[22m[39m                       # Releases the previously pushed web process type
    [36m[1mheroku container:release web worker[22m[39m                # Releases the previously pushed web and worker process types

USAGE
  $ heroku container:release

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -v, --verbose

DESCRIPTION
  Usage:
       heroku container:release web                       # Releases the previously pushed web process type
       heroku container:release web worker                # Releases the previously pushed web and worker process types
```

## `heroku container:rm`

remove the process type from your app

```
remove the process type from your app

    [1m[4m[35mUsage:[39m[24m[22m
    [36m[1mheroku container:rm web[22m[39m        # Destroys the web container
    [36m[1mheroku container:rm web worker[22m[39m # Destroys the web and worker containers

USAGE
  $ heroku container:rm

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Usage:
       heroku container:rm web        # Destroys the web container
       heroku container:rm web worker # Destroys the web and worker containers
```

## `heroku container:run`

builds, then runs the docker image locally

```
builds, then runs the docker image locally

    [1m[4m[35mUsage:[39m[24m[22m
    [36m[1mheroku container:run web bash[22m[39m # Runs bash on the local web docker container
    [36m[1mheroku container:run worker[22m[39m   # Runs the container CMD on the local worker container

USAGE
  $ heroku container:run

OPTIONS
  -a, --app=app        (required) app to run command against
  -p, --port=port      port the app will run on
  -r, --remote=remote  git remote of app to use
  -v, --verbose

DESCRIPTION
  Usage:
       heroku container:run web bash # Runs bash on the local web docker container
       heroku container:run worker   # Runs the container CMD on the local worker container
```
