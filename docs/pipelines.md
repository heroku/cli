`heroku pipelines`
==================

manage pipelines

* [`heroku pipelines`](#heroku-pipelines)
* [`heroku pipelines:add PIPELINE`](#heroku-pipelinesadd-pipeline)
* [`heroku pipelines:connect NAME`](#heroku-pipelinesconnect-name)
* [`heroku pipelines:create [NAME]`](#heroku-pipelinescreate-name)
* [`heroku pipelines:destroy PIPELINE`](#heroku-pipelinesdestroy-pipeline)
* [`heroku pipelines:diff`](#heroku-pipelinesdiff)
* [`heroku pipelines:info PIPELINE`](#heroku-pipelinesinfo-pipeline)

## `heroku pipelines`

list pipelines you have access to

```
USAGE
  $ heroku pipelines [--json]

FLAGS
  --json  output in json format

DESCRIPTION
  list pipelines you have access to

EXAMPLES
  $ heroku pipelines
```

_See code: [src/commands/pipelines/index.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/index.ts)_

## `heroku pipelines:add PIPELINE`

add this app to a pipeline

```
USAGE
  $ heroku pipelines:add PIPELINE -a <value> [-r <value>] [-s <value>]

ARGUMENTS
  PIPELINE  name of pipeline

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --stage=<value>   stage of first app in pipeline

DESCRIPTION
  add this app to a pipeline
  The app and pipeline names must be specified.
  The stage of the app will be guessed based on its name if not specified.

EXAMPLES
  $ heroku pipelines:add my-pipeline -a my-app -s production
```

_See code: [src/commands/pipelines/add.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/add.ts)_

## `heroku pipelines:connect NAME`

connect a GitHub repo to an existing pipeline

```
USAGE
  $ heroku pipelines:connect NAME -r <value>

ARGUMENTS
  NAME  name of pipeline

FLAGS
  -r, --repo=<value>  (required) the GitHub repository to connect to

DESCRIPTION
  connect a GitHub repo to an existing pipeline

EXAMPLES
  $ heroku pipelines:connect my-pipeline -r githuborg/reponame
```

_See code: [src/commands/pipelines/connect.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/connect.ts)_

## `heroku pipelines:create [NAME]`

create a new pipeline

```
USAGE
  $ heroku pipelines:create [NAME] -a <value> [-r <value>] [-s <value>] [-t <value>]

ARGUMENTS
  NAME  name of pipeline (defaults to basename of the app)

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --stage=<value>   stage of first app in pipeline
  -t, --team=<value>    the team which will own the apps

DESCRIPTION
  create a new pipeline
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.

EXAMPLES
  $ heroku pipelines:create -a my-app-staging

  $ heroku pipelines:create my-pipeline -a my-app-staging
```

_See code: [src/commands/pipelines/create.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/create.ts)_

## `heroku pipelines:destroy PIPELINE`

destroy a pipeline

```
USAGE
  $ heroku pipelines:destroy PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

DESCRIPTION
  destroy a pipeline

EXAMPLES
  $ heroku pipelines:destroy my-pipeline
```

_See code: [src/commands/pipelines/destroy.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/destroy.ts)_

## `heroku pipelines:diff`

compares the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:diff -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  compares the latest release of this app to its downstream app(s)

EXAMPLES
  $ heroku pipelines:diff -a my-app-staging
```

_See code: [src/commands/pipelines/diff.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/diff.ts)_

## `heroku pipelines:info PIPELINE`

show list of apps in a pipeline

```
USAGE
  $ heroku pipelines:info PIPELINE [--json]

ARGUMENTS
  PIPELINE  pipeline to show list of apps for

FLAGS
  --json  output in json format

DESCRIPTION
  show list of apps in a pipeline

EXAMPLES
  $ heroku pipelines:info my-pipeline
```

_See code: [src/commands/pipelines/info.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.11/packages/cli/src/commands/pipelines/info.ts)_
