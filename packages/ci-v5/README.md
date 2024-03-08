# Heroku CI CLI
[![Heroku CI Status](https://ci-badges.herokuapp.com/pipelines/420ca0bc-031b-479a-9335-1d51046daab2/master.svg)](https://dashboard.heroku.com/pipelines/420ca0bc-031b-479a-9335-1d51046daab2/tests)

The CLI plugin for Heroku CI

## Installation

This plugin is part of the official Heroku CLI, so there is no need to install it to run their commands.

## Development

First, please read [Developing CLI Plugins on Heroku's DevCenter](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins).

### Run Tests

```
$ npm test
```

### Deploy

1. Release a new version of this npm package. e.g. Using [`np`](https://www.npmjs.com/package/np)

```
› np

Publish a new version of heroku-ci (1.6.0)

? Select semver increment or specify new version minor 	1.7.0
? Will bump from 1.6.0 to 1.7.0. Continue? Yes
 ✔ Prerequisite check
 ✔ Git
 ✔ Cleanup
 ✔ Installing dependencies using Yarn
 ✔ Running tests
 ✔ Bumping version using Yarn
 ✔ Publishing package
 ✔ Pushing tags

 heroku-ci 1.7.0 published 🎉
```

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropriate heroku-ci version.

## Commands

All commands accept a `-a` flag. This should be the name of an app in the pipeline you have connected to Heroku CI. The `-a` flag can be omitted if you are in the directory of an app already.

`heroku ci:list`, aliased as `heroku ci`

Show the statuses of the most recent test runs. Add the `-w` or `--watch` flag to keep the session running and listen for updates.

`heroku ci:info NUMBER`

Show the status of a specific test run. If no run number is provided the most recent will be shown.

`heroku ci:last`

Show the status of the most recent test run

`heroku ci:run`

Run this from within your repo directory to trigger a test against the current branch and commit.

`heroku ci:rerun NUMBER`

Re-run a previous test run. If no test run number is provided, the most recent test run will be re-run.

`heroku ci:migrate-manifest`

Migrate the current directory from the deprecated `app-ci.json` file format to the new `app.json` + `environments`. [See the docs](https://devcenter.heroku.com/articles/heroku-ci-prerelease#migrating-applications-using-app-ci-json) for more details.

`heroku ci:debug`

Run this from within your repo directory to start and attach to a debug run. Useful for debugging failing test setup or a test which fails in CI but passes locally.
