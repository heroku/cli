`heroku reviewapps`
===================

disposable apps built on GitHub pull requests

* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku reviewapps:disable`

disable review apps or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of app to use
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps

EXAMPLE
  $ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  --autodeploy             autodeploy the review app
  --autodestroy            autodestroy the review app

EXAMPLE
  $ heroku reviewapps:enable -p mypipeline -a myapp --autodeploy --autodestroy
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/enable.ts)_
