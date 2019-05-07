@heroku-cli/plugin-ci
=====================

Heroku CLI plugin for Heroku CI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-ci.svg)](https://npmjs.org/package/@heroku-cli/plugin-ci)

[![CircleCI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/cli/tree/master)

[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/cli?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/cli/branch/master)
[![Codecov](https://codecov.io/gh/heroku/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-ci.svg)](https://npmjs.org/package/@heroku-cli/plugin-ci)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-ci.svg)](https://github.com/heroku/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-ci
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-ci/7.24.2 darwin-x64 node-v10.2.1
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->

<!-- commandsstop -->
* [`heroku ci:info`](#heroku-ci-info)
* [`heroku ci:last`](#heroku-ci-last)
* [`heroku ci:run`](#heroku-ci-run)
* [`heroku ci:rerun`](#heroku-ci-rerun)

## `heroku ci:info`

Shows the information for a particular ci run on a pipeline.

```
USAGE
  $ heroku ci:info 555 --pipeline=my-pipeline # 555 is the test number
```

## `heroku ci:last`

Shows the information for the last run for a given pipeline.

```
USAGE
  $ heroku ci:last --pipeline=my-pipeline
```

## `heroku ci:run`

Run this from within your repo directory to trigger a test agains the current branch and commit.

```
USAGE
  $ heroku ci:run --pipeline=my-pipeline
```

## `heroku ci:rerun`

Re-run a previous test run. If no test run number is provided, the most recent test run will be re-run.

```
USAGE
  $ heroku ci:rerun 555 --pipeline=my-pipeline  # 555 is the test number
```
