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
  $ heroku pipelines

OPTIONS
  --json  output in json format

EXAMPLE
  $ heroku pipelines
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/index.ts)_

## `heroku pipelines:add PIPELINE`

add this app to a pipeline

```
USAGE
  $ heroku pipelines:add PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    stage of first app in pipeline

DESCRIPTION
  The app and pipeline names must be specified.
  The stage of the app will be guessed based on its name if not specified.

EXAMPLE
  $ heroku pipelines:add my-pipeline -a my-app -s production
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/add.ts)_

## `heroku pipelines:connect NAME`

connect a github repo to an existing pipeline

```
USAGE
  $ heroku pipelines:connect NAME

ARGUMENTS
  NAME  name of pipeline

OPTIONS
  -r, --repo=repo  (required) the GitHub repository to connect to

EXAMPLE
  $ heroku pipelines:connect my-pipeline -r githuborg/reponame
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/connect.ts)_

## `heroku pipelines:create [NAME]`

'create a new pipeline

```
USAGE
  $ heroku pipelines:create [NAME]

ARGUMENTS
  NAME  name of pipeline (defaults to basename of the app)

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    stage of first app in pipeline
  -t, --team=team      the team which will own the apps

DESCRIPTION
  An existing app must be specified as the first app in the pipeline.
     The pipeline name will be inferred from the app name if not specified.
     The stage of the app will be guessed based on its name if not specified.
     The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.

EXAMPLES
  $ heroku pipelines:create -a my-app-staging
  $ heroku pipelines:create my-pipeline -a my-app-staging
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/create.ts)_

## `heroku pipelines:destroy PIPELINE`

destroy a pipeline

```
USAGE
  $ heroku pipelines:destroy PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

EXAMPLE
  $ heroku pipelines:destroy my-pipeline
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/destroy.ts)_

## `heroku pipelines:diff`

compares the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:diff

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLE
  $ heroku pipelines:diff -a my-app-staging
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/diff.ts)_

## `heroku pipelines:info PIPELINE`

show list of apps in a pipeline

```
USAGE
  $ heroku pipelines:info PIPELINE

ARGUMENTS
  PIPELINE  pipeline to show list of apps for

OPTIONS
  --json  output in json format

EXAMPLE
  $ heroku pipelines:info my-pipeline
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/info.ts)_

## `heroku pipelines:open PIPELINE`

open a pipeline in dashboard

```
USAGE
  $ heroku pipelines:open PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

EXAMPLE
  $ heroku pipelines:open my-pipeline
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/open.ts)_

## `heroku pipelines:promote`

promote the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:promote

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -t, --to=to          comma separated list of apps to promote to

EXAMPLE
  $ heroku pipelines:promote -a my-app-staging
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/promote.ts)_

## `heroku pipelines:remove`

remove this app from its pipeline

```
USAGE
  $ heroku pipelines:remove

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLE
  $ heroku pipelines:remove -a my-app
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/remove.ts)_

## `heroku pipelines:rename PIPELINE NAME`

rename a pipeline

```
USAGE
  $ heroku pipelines:rename PIPELINE NAME

ARGUMENTS
  PIPELINE  current name of pipeline
  NAME      new name of pipeline

EXAMPLE
  $ heroku pipelines:rename my-pipeline new-pipeline-name
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/rename.ts)_

## `heroku pipelines:setup [NAME] [REPO]`

bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)

```
USAGE
  $ heroku pipelines:setup [NAME] [REPO]

ARGUMENTS
  NAME  name of pipeline
  REPO  a GitHub repository to connect the pipeline to

OPTIONS
  -t, --team=team  the team to assign pipeline ownership to (defaults to current user)
  -y, --yes        accept all default settings without prompting

EXAMPLE
  $ heroku pipelines:setup my-pipeline githuborg/reponame -t my-team
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/setup.ts)_

## `heroku pipelines:transfer OWNER`

transfer ownership of a pipeline

```
USAGE
  $ heroku pipelines:transfer OWNER

ARGUMENTS
  OWNER  the owner to transfer the pipeline to

OPTIONS
  -c, --confirm=confirm
  -p, --pipeline=pipeline  (required) name of pipeline

EXAMPLES
  $ heroku pipelines:transfer admin@example.com -p my-pipeline
  $ heroku pipelines:transfer admin-team -p my-pipeline
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/transfer.ts)_

## `heroku pipelines:update`

update the app's stage in a pipeline

```
USAGE
  $ heroku pipelines:update

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    (required) new stage of app

EXAMPLE
  $ heroku pipelines:update -s staging -a my-app
```

_See code: [@heroku-cli/plugin-pipelines](https://github.com/heroku/cli/blob/v7.42.0/src/commands/pipelines/update.ts)_
