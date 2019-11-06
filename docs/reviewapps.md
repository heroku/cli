`heroku reviewapps`
===================

manage reviewapps in pipelines

* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku reviewapps:disable`

disable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of app to use
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps
  --beta                   use Review Apps 2.0 Beta

EXAMPLE
  $ heroku reviewapps:disable -p my-pipeline -a my-app --autodeploy
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.34.0/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable

OPTIONS
  -a, --app=app            parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of app to use
  --autodeploy             autodeploy the review app
  --autodestroy            autodestroy the review app
  --beta                   use Review Apps 2.0 Beta

EXAMPLE
  $ heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.34.0/src/commands/reviewapps/enable.ts)_
