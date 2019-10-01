`heroku ci`
===========

run an application test suite on Heroku

* [`heroku ci`](#heroku-ci)
* [`heroku ci:info TEST-RUN`](#heroku-ciinfo-test-run)
* [`heroku ci:last`](#heroku-cilast)
* [`heroku ci:rerun [NUMBER]`](#heroku-cirerun-number)
* [`heroku ci:run`](#heroku-cirun)

## `heroku ci`

display the most recent CI runs for the given pipeline

```
USAGE
  $ heroku ci

OPTIONS
  -a, --app=app            app name
  -p, --pipeline=pipeline  name of pipeline
  --json                   output in json format
  --watch                  keep running and watch for new and update tests

EXAMPLE
  $ heroku ci --app murmuring-headland-14719
```

_See code: [@heroku-cli/plugin-ci](https://github.com/heroku/cli/blob/v7.24.3/packages/ci/src/commands/ci/index.ts)_

## `heroku ci:info TEST-RUN`

show the status of a specific test run

```
USAGE
  $ heroku ci:info TEST-RUN

OPTIONS
  -a, --app=app            app name
  -p, --pipeline=pipeline  name of pipeline
  --node=node              the node number to show its setup and output

EXAMPLE
  $ heroku ci:info 1288 --app murmuring-headland-14719
```

_See code: [@heroku-cli/plugin-ci](https://github.com/heroku/cli/blob/v7.24.3/packages/ci/src/commands/ci/info.ts)_

## `heroku ci:last`

looks for the most recent run and returns the output of that run

```
USAGE
  $ heroku ci:last

OPTIONS
  -a, --app=app            app name
  -p, --pipeline=pipeline  name of pipeline
  --node=node              the node number to show its setup and output

EXAMPLE
  $ heroku ci:last --app murmuring-headland-14719 --node 100
```

_See code: [@heroku-cli/plugin-ci](https://github.com/heroku/cli/blob/v7.24.3/packages/ci/src/commands/ci/last.ts)_

## `heroku ci:rerun [NUMBER]`

rerun tests against current directory

```
USAGE
  $ heroku ci:rerun [NUMBER]

OPTIONS
  -a, --app=app            app name
  -p, --pipeline=pipeline  name of pipeline

EXAMPLE
  $ heroku ci:rerun 985 --app murmuring-headland-14719
```

_See code: [@heroku-cli/plugin-ci](https://github.com/heroku/cli/blob/v7.24.3/packages/ci/src/commands/ci/rerun.ts)_

## `heroku ci:run`

run tests against current directory

```
USAGE
  $ heroku ci:run

OPTIONS
  -a, --app=app            app name
  -p, --pipeline=pipeline  name of pipeline

EXAMPLE
  $ heroku ci:run --app murmuring-headland-14719
```

_See code: [@heroku-cli/plugin-ci](https://github.com/heroku/cli/blob/v7.24.3/packages/ci/src/commands/ci/run.ts)_
