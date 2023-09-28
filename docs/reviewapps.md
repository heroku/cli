`heroku reviewapps`
===================

manage reviewapps in pipelines

* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku reviewapps:disable`

disable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable -p <value> [-a <value>] [-r <value>] [--no-autodeploy] [--no-autodestroy]
    [--no-wait-for-ci]

FLAGS
  -a, --app=<value>       parent app used by review apps
  -p, --pipeline=<value>  (required) name of pipeline
  -r, --remote=<value>    git remote of app to use
  --no-autodeploy         disable autodeployments
  --no-autodestroy        disable automatically destroying review apps
  --no-wait-for-ci        disable wait for CI

DESCRIPTION
  disable review apps and/or settings on an existing pipeline

EXAMPLES
  $ heroku reviewapps:disable -p my-pipeline -a my-app --no-autodeploy
```

_See code: [src/commands/reviewapps/disable.ts](https://github.com/heroku/cli/blob/v8.4.4-beta.2/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable -p <value> [-a <value>] [-r <value>] [--autodeploy] [--autodestroy] [--wait-for-ci]

FLAGS
  -a, --app=<value>       parent app used by review apps
  -p, --pipeline=<value>  (required) name of pipeline
  -r, --remote=<value>    git remote of app to use
  --autodeploy            autodeploy the review app
  --autodestroy           autodestroy the review app
  --wait-for-ci           wait for CI to pass before deploying

DESCRIPTION
  enable review apps and/or settings on an existing pipeline

EXAMPLES
  $ heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy
```

_See code: [src/commands/reviewapps/enable.ts](https://github.com/heroku/cli/blob/v8.4.4-beta.2/src/commands/reviewapps/enable.ts)_
