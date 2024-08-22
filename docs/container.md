`heroku container`
==================

deploy your Docker-based app to Heroku

* [`heroku container`](#heroku-container)
* [`heroku container:login`](#heroku-containerlogin)
* [`heroku container:logout`](#heroku-containerlogout)
* [`heroku container:pull -a APP [-v] PROCESS_TYPE...`](#heroku-containerpull--a-app--v-process_type)
* [`heroku container:push`](#heroku-containerpush)
* [`heroku container:release`](#heroku-containerrelease)
* [`heroku container:rm -a APP [-v] PROCESS_TYPE...`](#heroku-containerrm--a-app--v-process_type)
* [`heroku container:run -a APP [-v] PROCESS_TYPE...`](#heroku-containerrun--a-app--v-process_type)

## `heroku container`

Use containers to build and deploy Heroku apps

```
USAGE
  $ heroku container

DESCRIPTION
  Use containers to build and deploy Heroku apps
```

_See code: [src/commands/container/index.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/index.ts)_

## `heroku container:login`

log in to Heroku Container Registry

```
USAGE
  $ heroku container:login [-v]

FLAGS
  -v, --verbose

DESCRIPTION
  log in to Heroku Container Registry
```

_See code: [src/commands/container/login.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/login.ts)_

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

_See code: [src/commands/container/logout.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/logout.ts)_

## `heroku container:pull -a APP [-v] PROCESS_TYPE...`

pulls an image from an app's process type

```
USAGE
  $ heroku container:pull -a APP [-v] PROCESS_TYPE...

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  pulls an image from an app's process type

EXAMPLES
    $ heroku container:pull web        # Pulls the web image from the app
    $ heroku container:pull web worker # Pulls both the web and worker images from the app
    $ heroku container:pull web:latest # Pulls the latest tag from the web image
```

_See code: [src/commands/container/pull.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/pull.ts)_

## `heroku container:push`

builds, then pushes Docker images to deploy your Heroku app

```
USAGE
  $ heroku container:push -a <value> [-v] [-R] [--arg <value>] [--context-path <value>] [-r <value>]

FLAGS
  -R, --recursive             pushes Dockerfile.<process> found in current and subdirectories
  -a, --app=<value>           (required) app to run command against
  -r, --remote=<value>        git remote of app to use
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

_See code: [src/commands/container/push.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/push.ts)_

## `heroku container:release`

Releases previously pushed Docker images to your Heroku app

```
USAGE
  $ heroku container:release

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  Releases previously pushed Docker images to your Heroku app

EXAMPLES
    heroku container:release web        # Releases the previously pushed web process type
    heroku container:release web worker # Releases the previously pushed web and worker process types
```

_See code: [src/commands/container/release.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/release.ts)_

## `heroku container:rm -a APP [-v] PROCESS_TYPE...`

remove the process type from your app

```
USAGE
  $ heroku container:rm -a APP [-v] PROCESS_TYPE...

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove the process type from your app

EXAMPLES
    heroku container:rm web        # Destroys the web container
    heroku container:rm web worker # Destroys the web and worker containers
```

_See code: [src/commands/container/rm.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/rm.ts)_

## `heroku container:run -a APP [-v] PROCESS_TYPE...`

builds, then runs the docker image locally

```
USAGE
  $ heroku container:run -a APP [-v] PROCESS_TYPE...

FLAGS
  -a, --app=<value>     (required) app to run command against
  -p, --port=<value>    [default: 5000] port the app will run on
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  builds, then runs the docker image locally

EXAMPLES
    $ heroku container:pull web        # Pulls the web image from the app
    $ heroku container:pull web worker # Pulls both the web and worker images from the app
    $ heroku container:pull web:latest # Pulls the latest tag from the web image
```

_See code: [src/commands/container/run.ts](https://github.com/heroku/cli/blob/v9.2.0-beta.1/packages/cli/src/commands/container/run.ts)_
