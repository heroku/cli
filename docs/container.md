heroku container
================


# Commands

* [heroku container](#container)
* [heroku container:login [OPTIONS]](#containerlogin)
* [heroku container:logout [OPTIONS]](#containerlogout)
* [heroku container:push [OPTIONS]](#containerpush)
* [heroku container:rm [OPTIONS]](#containerrm)
* [heroku container:run [OPTIONS]](#containerrun)
## container

Use containers to build and deploy Heroku apps

```
USAGE
  $ heroku container
```

### container:login

log in to Heroku Container Registry

```
USAGE
  $ heroku container:login [OPTIONS]

OPTIONS
  -v, --verbose

DESCRIPTION
  Usage:
           heroku container:login
```

### container:logout

log out from Heroku Container Registry

```
USAGE
  $ heroku container:logout [OPTIONS]

OPTIONS
  -v, --verbose
```

### container:push

builds, then pushes Docker images to deploy your Heroku app

```
USAGE
  $ heroku container:push [OPTIONS]

OPTIONS
  -R, --recursive      pushes Dockerfile.<process> found in current and subdirectories
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -v, --verbose
  --arg=arg            set build-time variables

DESCRIPTION

       Usage:
       heroku container:push web                          # Pushes Dockerfile to web process type
       heroku container:push web worker --recursive       # Pushes Dockerfile.web and Dockerfile.worker
       heroku container:push --recursive                  # Pushes Dockerfile.*
       heroku container:push web --arg ENV=live,HTTPS=on  # Build-time variables
```

### container:rm

remove the process type from your app

```
USAGE
  $ heroku container:rm [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

       Usage:
       heroku container:rm web        # Destroys the web container
       heroku container:rm web worker # Destroys the web and worker containers
```

### container:run

builds, then runs the docker image locally

```
USAGE
  $ heroku container:run [OPTIONS]

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
