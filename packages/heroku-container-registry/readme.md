# Heroku CLI Docker Plugin

Develop with Docker. Deploy to Heroku.

## OSX Prerequisite: boot2docker or similar

If you already have some mechanism of hosting Docker locally, you can skip this step.
If you're new to Docker on OSX, we recommend
[installing boot2docker](http://boot2docker.io/).

Before using Heroku-Docker, you should make sure `docker` works in your shell:

```
docker ps
```

If you see errors there, you may need to initialize boot2docker:

```
boot2docker stop && boot2docker start
$(boot2docker shellinit)
```

You can do this init in your bash profile; that's out of scope for these docs.

## Install the latest plugin

```
heroku plugins:uninstall heroku-docker
heroku plugins:install heroku-docker
```

## Tutorials

- [Starting a new Node.js project](docs/new-project.md)
- [Dockerizing Heroku's Node.js getting started project](docs/node-getting-started.md)
- [Hacking on this plugin](docs/hacking.md)

## Plugin API

### `docker:init [--template <templateName>]`

Initializes a Dockerfile in the current directory.

If --template is provided, uses that Dockerfile template.
All templates are in /platforms.
If no template is provided,
runs `detect` on each platform to see if a platform can be detected.
If nothing is detected, creates a Dockerfile from a default 'minimal' template
based on Heroku's Cedar-14 stack.

### `docker:exec <command string>`

Mounts the current directory into a container built from the Dockerfile,
then executes the provided command.

### `docker:start [ process type ]`

Copies the current directory into a container built from the Dockerfile,
then executes the process type specified (`web` by default).

When starting a `web` process, `docker:start` provides the web server's URL.

### `docker:release`

Builds a slug within the local container then releases it to a Heroku app
via the Heroku Platform API.
Creates any containers necessary for the build automatically.

### `docker:clean`

Removes all Heroku-Docker images from the Docker host.

## Testing

`npm test`

- Assumes that `docker` is accessible
- Assumes that it's being run in a directory that the docker host (like boot2docker) can mount
