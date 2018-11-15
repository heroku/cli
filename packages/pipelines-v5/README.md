# Pipelines Plugin for Heroku Toolbelt

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[![npm
version](https://img.shields.io/npm/v/heroku-pipelines.svg)](https://www.npmjs.com/package/heroku-pipelines)
[![build status](https://img.shields.io/circleci/project/heroku/heroku-pipelines.svg)](https://circleci.com/gh/heroku/heroku-pipelines)
[![codecov](https://codecov.io/gh/heroku/heroku-pipelines/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-pipelines)

A Heroku CLI plugin for [continuous delivery](https://www.heroku.com/continuous-delivery) on Heroku.

This plugin is used to set up a collection of apps sharing a common codebase where the latest slug of one app can be promoted to the app(s) in the following stage. The promotion only copies the upstream build artifact and leaves the downstream app's config vars, add-ons, and Git repo untouched.

## How to install this plugin

This plugin is installed by default with the
[Heroku CLI](https://cli.heroku.com/). You do not need to install it
yourself. Just update your CLI:

```
$ heroku update
```

## Using Pipelines

https://devcenter.heroku.com/articles/pipelines

## Development

First, please read [Developing CLI Plugins on Heroku's DevCenter](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins).

#### Run Tests

```
$ npm test
```

#### Deploy

1. Release a new version of this npm package.

  ```
  $ npm version patch/minor/major
  ```

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropriate heroku-pipelines version.


#### Commands

<!-- commands -->
* [`heroku pipelines`](#heroku-pipelines)
* [`heroku pipelines:add PIPELINE`](#heroku-pipelinesadd-pipeline)
* [`heroku pipelines:connect [NAME]`](#heroku-pipelinesconnect-name)
* [`heroku pipelines:create [NAME]`](#heroku-pipelinescreate-name)
* [`heroku pipelines:destroy PIPELINE`](#heroku-pipelinesdestroy-pipeline)
* [`heroku pipelines:diff`](#heroku-pipelinesdiff)
* [`heroku pipelines:info PIPELINE`](#heroku-pipelinesinfo-pipeline)
* [`heroku pipelines:list`](#heroku-pipelineslist)
* [`heroku pipelines:open PIPELINE`](#heroku-pipelinesopen-pipeline)
* [`heroku pipelines:promote`](#heroku-pipelinespromote)
* [`heroku pipelines:remove`](#heroku-pipelinesremove)
* [`heroku pipelines:rename PIPELINE NAME`](#heroku-pipelinesrename-pipeline-name)
* [`heroku pipelines:setup [NAME] [REPO]`](#heroku-pipelinessetup-name-repo)
* [`heroku pipelines:transfer OWNER`](#heroku-pipelinestransfer-owner)
* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku pipelines`

list pipelines you have access to

```
USAGE
  $ heroku pipelines

OPTIONS
  --json  output in json format

EXAMPLES
  $ heroku pipelines
  === My Pipelines
  example
  sushi
```

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

EXAMPLES
  $ heroku pipelines:add example -a example-admin -s production
  Adding example-admin to example pipeline as production... done
```

## `heroku pipelines:connect [NAME]`

connect a github repo to an existing pipeline

```
USAGE
  $ heroku pipelines:connect [NAME]

ARGUMENTS
  NAME  name of pipeline

OPTIONS
  -r, --repo=repo  (required) the GitHub repository to connect

EXAMPLES
  $ heroku pipelines:connect example -r githuborg/reponame
  Configuring pipeline... done
```

## `heroku pipelines:create [NAME]`

create a new pipeline

```
USAGE
  $ heroku pipelines:create [NAME]

ARGUMENTS
  NAME  name of pipeline, defaults to basename of app

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --stage=stage    stage of first app in pipeline
  -t, --team=team      team to use

DESCRIPTION
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.

EXAMPLES
  $ heroku pipelines:create -a example-staging
  ? Pipeline name: example
  ? Stage of example-staging: staging
  Creating example pipeline... done
  Adding example-staging to example pipeline as staging... done
```

## `heroku pipelines:destroy PIPELINE`

destroy a pipeline

```
USAGE
  $ heroku pipelines:destroy PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

EXAMPLES
  $ heroku pipelines:destroy example
  Destroying example pipeline... done
```

## `heroku pipelines:diff`

compares the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:diff

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku pipelines:diff --app murmuring-headland-14719
```

## `heroku pipelines:info PIPELINE`

show list of apps in a pipeline

```
USAGE
  $ heroku pipelines:info PIPELINE

ARGUMENTS
  PIPELINE  pipeline to show

OPTIONS
  --json  output in json format

EXAMPLES
  $ heroku pipelines:info example
  === example
  owner: my-team (team)

  app name                     stage
  ───────────────────────────  ──────────
  ⬢ example-pr-16              review
  ⬢ example-pr-19              review
  ⬢ example-pr-23              review
  ⬢ example-staging            staging
  ⬢ example-staging-2          staging
  ⬢ example-production         production
```

## `heroku pipelines:list`

list pipelines you have access to

```
USAGE
  $ heroku pipelines:list

OPTIONS
  --json  output in json format

EXAMPLES
  $ heroku pipelines
  === My Pipelines
  example
  sushi
```

## `heroku pipelines:open PIPELINE`

open a pipeline in dashboard

```
USAGE
  $ heroku pipelines:open PIPELINE

ARGUMENTS
  PIPELINE  name of pipeline

EXAMPLES
  $ heroku pipelines:open example
```

## `heroku pipelines:promote`

promote the latest release of this app to its downstream app(s)

```
USAGE
  $ heroku pipelines:promote

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -t, --to=to          comma separated list of apps to promote to

EXAMPLES
  $ heroku pipelines:promote -a example-staging
  Promoting example-staging to example (production)... done, v23
  Promoting example-staging to example-admin (production)... done, v54

  $ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
  Starting promotion to apps: my-production-app1,my-production-app2... done
  Waiting for promotion to complete... done
  Promotion successful
  my-production-app1: succeeded
  my-production-app2: succeeded
```

## `heroku pipelines:remove`

remove this app from its pipeline

```
USAGE
  $ heroku pipelines:remove

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku pipelines:remove -a example-admin
  Removing example-admin... done
```

## `heroku pipelines:rename PIPELINE NAME`

rename a pipeline

```
USAGE
  $ heroku pipelines:rename PIPELINE NAME

ARGUMENTS
  PIPELINE  current name of pipeline
  NAME      new name of pipeline

EXAMPLES
  $ heroku pipelines:rename example www
  Renaming example pipeline to www... done
```

## `heroku pipelines:setup [NAME] [REPO]`

bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)

```
USAGE
  $ heroku pipelines:setup [NAME] [REPO]

ARGUMENTS
  NAME  name of pipeline
  REPO  a GitHub repository to connect the pipeline to

OPTIONS
  -t, --team=team  team to use
  -y, --yes        accept all default settings without prompting

EXAMPLES
  $ heroku pipelines:setup example githuborg/reponame -o example-org
  ? Automatically deploy the master branch to staging? Yes
  ? Wait for CI to pass before deploying the master branch to staging? Yes
  ? Enable review apps? Yes
  ? Automatically create review apps for every PR? Yes
  ? Automatically destroy idle review apps after 5 days? Yes
  ? Enable automatic Heroku CI test runs? Yes
  Creating pipeline... done
  Linking to repo... done
  Creating production and staging apps (⬢ example and ⬢ example-staging)
  Configuring pipeline... done
  View your new pipeline by running `heroku pipelines:open e5a55ffa-de3f-11e6-a245-3c15c2e6bc1e`
```

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
  $ heroku pipelines:transfer me@example.com -p example
  === example

  app name              stage
  ────────────────────  ───────────
  ⬢ example-dev         development
  ⬢ example-staging     staging
  ⬢ example-prod        production

    ▸    This will transfer example and all of the listed apps to the me@example.com account
    ▸    to proceed, type example or re-run this command with --confirm example
  > example
  Transferring example pipeline to the me@example.com account... done

  $ heroku pipelines:transfer acme-widgets -p example
  === example

  app name              stage
  ────────────────────  ───────────
  ⬢ example-dev         development
  ⬢ example-staging     staging
  ⬢ example-prod        production

    ▸    This will transfer example and all of the listed apps to the acme-widgets team
    ▸    to proceed, type example or re-run this command with --confirm example
  > example

  Transferring example pipeline to the acme-widgets team... done
```

## `heroku reviewapps:disable`

disable review apps or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of parent app used by review apps
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps

EXAMPLES
  $ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
  Disabling auto deployment ...
  Configuring pipeline... done
```

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of parent app used by review apps
  --autodeploy             autodeploy the review app
  --autodestroy            autodestroy the review app

EXAMPLES
  $ heroku reviewapps:enable -p mypipeline --a myapp --autodeploy --autodestroy
  Enabling review apps ...
  Enabling auto deployment ...
  Enabling auto destroy ...
  Configuring pipeline... done
```
<!-- commandsstop -->
