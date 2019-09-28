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
* [`heroku pipelines:setup [NAME] [REPO]`](#heroku-pipelinessetup-name-repo)

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
<!-- commandsstop -->
