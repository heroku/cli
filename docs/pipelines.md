`heroku pipelines`
==================

list pipelines you have access to

* [`heroku pipelines`](#heroku-pipelines)
* [`heroku pipelines:add PIPELINE`](#heroku-pipelinesadd-pipeline)
* [`heroku pipelines:connect NAME`](#heroku-pipelinesconnect-name)
* [`heroku pipelines:create [NAME]`](#heroku-pipelinescreate-name)
* [`heroku pipelines:destroy PIPELINE`](#heroku-pipelinesdestroy-pipeline)
* [`heroku pipelines:diff`](#heroku-pipelinesdiff)
* [`heroku pipelines:info PIPELINE`](#heroku-pipelinesinfo-pipeline)
* [`heroku pipelines:open PIPELINE`](#heroku-pipelinesopen-pipeline)
* [`heroku pipelines:promote`](#heroku-pipelinespromote)
* [`heroku pipelines:remove`](#heroku-pipelinesremove)
* [`heroku pipelines:rename PIPELINE NAME`](#heroku-pipelinesrename-pipeline-name)
* [`heroku pipelines:setup [NAME] [REPO]`](#heroku-pipelinessetup-name-repo)
* [`heroku pipelines:transfer OWNER`](#heroku-pipelinestransfer-owner)
* [`heroku pipelines:update`](#heroku-pipelinesupdate)

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

_See code: [src/commands/pipelines/index.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/index.ts)_

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

_See code: [src/commands/pipelines/add.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/add.ts)_

## `heroku pipelines:connect NAME`

connect a github repo to an existing pipeline

```
USAGE
  $ heroku pipelines:connect NAME -r <value>

ARGUMENTS
  NAME  name of pipeline

FLAGS
  -r, --repo=<value>  (required) the GitHub repository to connect to

DESCRIPTION
  connect a github repo to an existing pipeline

EXAMPLES
  $ heroku pipelines:connect my-pipeline -r githuborg/reponame
```

_See code: [src/commands/pipelines/connect.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/connect.ts)_

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

_See code: [src/commands/pipelines/create.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/create.ts)_

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

_See code: [src/commands/pipelines/destroy.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/destroy.ts)_

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

_See code: [src/commands/pipelines/diff.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/diff.ts)_

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

_See code: [src/commands/pipelines/info.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/info.ts)_

## `heroku pipelines:open PIPELINE`

open a pipeline in dashboard

```
USAGE
  $ heroku pipelines:open PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

DESCRIPTION
  open a pipeline in dashboard

EXAMPLES
  $ heroku pipelines:open my-pipeline
```

_See code: [src/commands/pipelines/open.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/open.ts)_

## `heroku pipelines:promote`

promote the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:promote -a <value> [-r <value>] [-t <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -t, --to=<value>      comma separated list of apps to promote to

DESCRIPTION
  promote the latest release of this app to its downstream app(s)

EXAMPLES
  $ heroku pipelines:promote -a my-app-staging
```

_See code: [src/commands/pipelines/promote.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/promote.ts)_

## `heroku pipelines:remove`

remove this app from its pipeline

```
USAGE
  $ heroku pipelines:remove -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove this app from its pipeline

EXAMPLES
  $ heroku pipelines:remove -a my-app
```

_See code: [src/commands/pipelines/remove.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/remove.ts)_

## `heroku pipelines:rename PIPELINE NAME`

rename a pipeline

```
USAGE
  $ heroku pipelines:rename PIPELINE NAME

ARGUMENTS
  PIPELINE  current name of pipeline
  NAME      new name of pipeline

DESCRIPTION
  rename a pipeline

EXAMPLES
  $ heroku pipelines:rename my-pipeline new-pipeline-name
```

_See code: [src/commands/pipelines/rename.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/rename.ts)_

## `heroku pipelines:setup [NAME] [REPO]`

bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)

```
USAGE
  $ heroku pipelines:setup [NAME] [REPO] [-t <value>] [-y]

ARGUMENTS
  NAME  name of pipeline
  REPO  a GitHub repository to connect the pipeline to

FLAGS
  -t, --team=<value>  the team to assign pipeline ownership to (defaults to current user)
  -y, --yes           accept all default settings without prompting

DESCRIPTION
  bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed
  app.json in the repo)

EXAMPLES
  $ heroku pipelines:setup my-pipeline githuborg/reponame -t my-team
```

_See code: [src/commands/pipelines/setup.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/setup.ts)_

## `heroku pipelines:transfer OWNER`

transfer ownership of a pipeline

```
USAGE
  $ heroku pipelines:transfer OWNER -p <value> [-c <value>]

ARGUMENTS
  OWNER  the owner to transfer the pipeline to

FLAGS
  -c, --confirm=<value>
  -p, --pipeline=<value>  (required) name of pipeline

DESCRIPTION
  transfer ownership of a pipeline

EXAMPLES
  $ heroku pipelines:transfer admin@example.com -p my-pipeline

  $ heroku pipelines:transfer admin-team -p my-pipeline
```

_See code: [src/commands/pipelines/transfer.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/transfer.ts)_

## `heroku pipelines:update`

update the app's stage in a pipeline

```
USAGE
  $ heroku pipelines:update -a <value> -s <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --stage=<value>   (required) new stage of app

DESCRIPTION
  update the app's stage in a pipeline

EXAMPLES
  $ heroku pipelines:update -s staging -a my-app
```

_See code: [src/commands/pipelines/update.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.9/src/commands/pipelines/update.ts)_
