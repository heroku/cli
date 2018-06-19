# Heroku Container Registry CLI plugin

Heroku CLI plugin to release apps to Heroku that are built on local containers.

## Installation

```
$ heroku plugins:install @heroku-cli/plugin-container-registry
```

## Use

In a directory with a Dockerfile:

```
$ heroku container:login
$ heroku create
$ heroku container:push
$ heroku container:release web
$ heroku container:pull web
$ heroku open
```
