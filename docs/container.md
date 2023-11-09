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
USAGE
  $ heroku container

DESCRIPTION
  Use containers to build and deploy Heroku apps
```

## `heroku container:login`

log in to Heroku Container Registry

```
USAGE
  $ heroku container:login [-v]

FLAGS
  -v, --verbose

DESCRIPTION
  log in to Heroku Container Registry
  Usage:
  heroku container:login
```

## `heroku container:logout`

log out from Heroku Container Registry

```
USAGE
  $ heroku container:logout [-v]

FLAGS
  -v, --verbose

DESCRIPTION
  log out from Heroku Container Registry
```

## `heroku container:pull`

pulls an image from an app's process type

```
USAGE
  $ heroku container:pull -a <value> [-v] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  pulls an image from an app's process type

  Usage:
  heroku container:pull web        # Pulls the web image from the app
  heroku container:pull web worker # Pulls both the web and worker images from the app
  heroku container:pull web:latest # Pulls the latest tag from the web image
```

## `heroku container:push`

builds, then pushes Docker images to deploy your Heroku app

```
USAGE
  $ heroku container:push -a <value> [-v] [-R] [--arg <value>] [--context-path <value>] [-r <value>]

FLAGS
  -R, --recursive         pushes Dockerfile.<process> found in current and subdirectories
  -a, --app=<value>       (required) app to run command against
  -r, --remote=<value>    git remote of app to use
  -v, --verbose
  --arg=<value>           set build-time variables
  --context-path=<value>  path to use as build context (defaults to Dockerfile dir)

DESCRIPTION
  builds, then pushes Docker images to deploy your Heroku app


EXAMPLES
  $ heroku container:push web                          # Pushes Dockerfile to web process type

  $ heroku container:push worker                       # Pushes Dockerfile to worker process type

  $ heroku container:push web worker --recursive       # Pushes Dockerfile.web and Dockerfile.worker

  $ heroku container:push --recursive                  # Pushes Dockerfile.*

  $ heroku container:push web --arg ENV=live,HTTPS=on  # Build-time variables

  $ heroku container:push --recursive --context-path . # Pushes Dockerfile.* using current dir as build context
```

## `heroku container:release`

Releases previously pushed Docker images to your Heroku app

```
USAGE
  $ heroku container:release -a <value> [-v] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  Releases previously pushed Docker images to your Heroku app

  Usage:
  heroku container:release web                       # Releases the previously pushed web process type
  heroku container:release web worker                # Releases the previously pushed web and worker process types
```

## `heroku container:rm`

remove the process type from your app

```
USAGE
  $ heroku container:rm -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove the process type from your app

  Usage:
  heroku container:rm web        # Destroys the web container
  heroku container:rm web worker # Destroys the web and worker containers
```

## `heroku container:run`

builds, then runs the docker image locally

```
USAGE
  $ heroku container:run -a <value> [-p <value>] [-v] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -p, --port=<value>    port the app will run on
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  builds, then runs the docker image locally

  Usage:
  heroku container:run web bash # Runs bash on the local web docker container
  heroku container:run worker   # Runs the container CMD on the local worker container
```
