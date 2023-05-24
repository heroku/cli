@heroku-cli/plugin-ci
=====================

Heroku CLI plugin for Heroku CI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-ci.svg)](https://npmjs.org/package/@heroku-cli/plugin-ci)

[![CircleCI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/cli/tree/master)

[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/cli?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/cli/branch/master)
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
$ heroku (--version|-v)
@heroku-cli/plugin-ci/8.1.4 darwin-x64 node-v16.19.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku ci`](#heroku-ci)
* [`heroku ci:info TEST-RUN`](#heroku-ciinfo-test-run)
* [`heroku ci:last`](#heroku-cilast)
* [`heroku ci:rerun [NUMBER]`](#heroku-cirerun-number)
* [`heroku ci:run`](#heroku-cirun)

## `heroku ci`

display the most recent CI runs for the given pipeline

```
USAGE
  $ heroku ci [-a <value>] [--watch] [-p <value>] [--json]

FLAGS
  -a, --app=<value>       app name
  -p, --pipeline=<value>  name of pipeline
  --json                  output in json format
  --watch                 keep running and watch for new and update tests

DESCRIPTION
  display the most recent CI runs for the given pipeline

EXAMPLES
  $ heroku ci --app murmuring-headland-14719
```

_See code: [src/commands/ci/index.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ci/src/commands/ci/index.ts)_

## `heroku ci:info TEST-RUN`

show the status of a specific test run

```
USAGE
  $ heroku ci:info TEST-RUN [-a <value>] [--node <value>] [-p <value>]

FLAGS
  -a, --app=<value>       app name
  -p, --pipeline=<value>  name of pipeline
  --node=<value>          the node number to show its setup and output

DESCRIPTION
  show the status of a specific test run

EXAMPLES
  $ heroku ci:info 1288 --app murmuring-headland-14719
```

_See code: [src/commands/ci/info.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ci/src/commands/ci/info.ts)_

## `heroku ci:last`

looks for the most recent run and returns the output of that run

```
USAGE
  $ heroku ci:last [-a <value>] [--node <value>] [-p <value>]

FLAGS
  -a, --app=<value>       app name
  -p, --pipeline=<value>  name of pipeline
  --node=<value>          the node number to show its setup and output

DESCRIPTION
  looks for the most recent run and returns the output of that run

EXAMPLES
  $ heroku ci:last --pipeline=my-pipeline --node 100
```

_See code: [src/commands/ci/last.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ci/src/commands/ci/last.ts)_

## `heroku ci:rerun [NUMBER]`

rerun tests against current directory

```
USAGE
  $ heroku ci:rerun [NUMBER] [-a <value>] [-p <value>]

FLAGS
  -a, --app=<value>       app name
  -p, --pipeline=<value>  name of pipeline

DESCRIPTION
  rerun tests against current directory

EXAMPLES
  $ heroku ci:rerun 985 --app murmuring-headland-14719
```

_See code: [src/commands/ci/rerun.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ci/src/commands/ci/rerun.ts)_

## `heroku ci:run`

run tests against current directory

```
USAGE
  $ heroku ci:run [-a <value>] [-p <value>]

FLAGS
  -a, --app=<value>       app name
  -p, --pipeline=<value>  name of pipeline

DESCRIPTION
  run tests against current directory

EXAMPLES
  $ heroku ci:run --app murmuring-headland-14719
```

_See code: [src/commands/ci/run.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ci/src/commands/ci/run.ts)_
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
