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
```

## `heroku container:login`

log in to Heroku Container Registry

```
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
USAGE
  $ heroku container:logout

OPTIONS
  -v, --verbose
```

## `heroku container:pull`

pulls an image from an app's process type

```
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
