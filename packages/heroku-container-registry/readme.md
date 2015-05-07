# Heroku Toolbelt Docker Plugin

Develop with Docker. Deploy to Heroku.

## Installation

    heroku plugins:install heroku-docker

A working local Docker installation is required. Docker 1.6 or later is recommended and 1.6 is required on Windows. We recommend [Boot2docker](http://boot2docker.io/) for users on OS X and Windows.

See the following Dev Center guides for details on how to user the plugin:

 * [Introduction: Local Development with Docker](https://devcenter.heroku.com/articles/introduction-local-development-with-docker?preview=1)
 * [Getting started with Node.js and Heroku local Docker dev](https://devcenter.heroku.com/articles/getting-started-with-node-js-and-heroku-local-docker-dev?preview=1)
 * [Getting started with Ruby and Heroku local Docker dev](https://devcenter.heroku.com/articles/getting-started-with-ruby-and-heroku-local-docker-dev?preview=1)

## Testing

`npm test`

- Requires io.js
- Assumes that `docker` is accessible
- Assumes that it's being run in a directory that the docker host (like boot2docker) can mount
