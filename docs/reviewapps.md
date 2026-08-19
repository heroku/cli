`heroku reviewapps`
===================

manage reviewapps in pipelines

* [`heroku reviewapps:create`](#heroku-reviewappscreate)
* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)
* [`heroku reviewapps:wait APP`](#heroku-reviewappswait-app)

## `heroku reviewapps:create`

create a review app from a pipeline's connected repository

```
USAGE
  $ heroku reviewapps:create -b <value> -p <value> [--prompt] [--wait] [--wait-interval <value>]

FLAGS
  -b, --branch=<value>         (required) branch to create the review app from
  -p, --pipeline=<value>       (required) name of pipeline
      --wait                   watch review app creation status and exit when complete
      --wait-interval=<value>  how frequently to poll in seconds (use with --wait)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  create a review app from a pipeline's connected repository

EXAMPLES
   $ heroku reviewapps:create -p my-pipeline -b my-branch --wait
```

_See code: [src/commands/reviewapps/create.ts](https://github.com/heroku/cli/blob/v11.10.0/src/commands/reviewapps/create.ts)_

## `heroku reviewapps:disable`

disable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable -p <value> [--prompt] [-a <value>] [--no-autodeploy] [--no-autodestroy] [--no-wait-for-ci]
    [-r <value>]

FLAGS
  -a, --app=<value>       [env: HEROKU_APP] parent app used by review apps
  -p, --pipeline=<value>  (required) name of pipeline
  -r, --remote=<value>    git remote of app to use
      --no-autodeploy     disable autodeployments
      --no-autodestroy    disable automatically destroying review apps
      --no-wait-for-ci    disable wait for CI

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  disable review apps and/or settings on an existing pipeline

EXAMPLES
   $ heroku reviewapps:disable -p my-pipeline -a my-app --no-autodeploy
```

_See code: [src/commands/reviewapps/disable.ts](https://github.com/heroku/cli/blob/v11.10.0/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable -p <value> [--prompt] [-a <value>] [--autodeploy] [--autodestroy] [-r <value>]
    [--wait-for-ci]

FLAGS
  -a, --app=<value>       [env: HEROKU_APP] parent app used by review apps
  -p, --pipeline=<value>  (required) name of pipeline
  -r, --remote=<value>    git remote of app to use
      --autodeploy        autodeploy the review app
      --autodestroy       autodestroy the review app
      --wait-for-ci       wait for CI to pass before deploying

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  enable review apps and/or settings on an existing pipeline

EXAMPLES
   $ heroku reviewapps:enable -p my-pipeline -a my-app --autodeploy --autodestroy
```

_See code: [src/commands/reviewapps/enable.ts](https://github.com/heroku/cli/blob/v11.10.0/src/commands/reviewapps/enable.ts)_

## `heroku reviewapps:wait APP`

wait for a review app to finish creating

```
USAGE
  $ heroku reviewapps:wait APP [--prompt] [--wait-interval <value>]

ARGUMENTS
  APP  unique identifier or name of the app

FLAGS
  --wait-interval=<value>  how frequently to poll in seconds

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  wait for a review app to finish creating
```

_See code: [src/commands/reviewapps/wait.ts](https://github.com/heroku/cli/blob/v11.10.0/src/commands/reviewapps/wait.ts)_
