`heroku ci`
===========

test runner for Heroku Pipelines

* [`heroku ci`](#heroku-ci)
* [`heroku ci:config`](#heroku-ciconfig)
* [`heroku ci:config:get KEY`](#heroku-ciconfigget-key)
* [`heroku ci:config:set`](#heroku-ciconfigset)
* [`heroku ci:config:unset`](#heroku-ciconfigunset)
* [`heroku ci:debug`](#heroku-cidebug)
* [`heroku ci:info TEST-RUN`](#heroku-ciinfo-test-run)
* [`heroku ci:last`](#heroku-cilast)
* [`heroku ci:migrate-manifest`](#heroku-cimigrate-manifest)
* [`heroku ci:open`](#heroku-ciopen)
* [`heroku ci:rerun [NUMBER]`](#heroku-cirerun-number)
* [`heroku ci:run`](#heroku-cirun)

## `heroku ci`

display the most recent CI runs for the given pipeline

```
USAGE
  $ heroku ci [--prompt] [-a <value>] [--json] [-p <value>] [-r <value>] [--watch]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use
      --json              output in json format
      --watch             keep running and watch for new and update tests

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display the most recent CI runs for the given pipeline

EXAMPLES
   $ heroku ci --app murmuring-headland-14719
```

_See code: [src/commands/ci/index.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/index.ts)_

## `heroku ci:config`

display CI config vars

```
USAGE
  $ heroku ci:config [--prompt] [-a <value>] [--json] [-p <value>] [-r <value>] [-s]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use
  -s, --shell             output config vars in shell format
      --json              output config vars in json format

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display CI config vars

EXAMPLES
   $ heroku ci:config --app murmuring-headland-14719 --json
```

_See code: [src/commands/ci/config/index.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/config/index.ts)_

## `heroku ci:config:get KEY`

get a CI config var

```
USAGE
  $ heroku ci:config:get KEY [--prompt] [-a <value>] [-p <value>] [-r <value>] [-s]

ARGUMENTS
  KEY  name of the config var key

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use
  -s, --shell             output config var in shell format

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  get a CI config var

EXAMPLES
   $ heroku ci:config:get --pipeline=PIPELINE RAILS_ENV test
```

_See code: [src/commands/ci/config/get.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/config/get.ts)_

## `heroku ci:config:set`

set CI config vars

```
USAGE
  $ heroku ci:config:set [--prompt] [-a <value>] [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  set CI config vars

EXAMPLES
   $ heroku ci:config:set --pipeline PIPELINE RAILS_ENV=test 
  Setting test config vars... done
  RAILS_ENV: test
```

_See code: [src/commands/ci/config/set.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/config/set.ts)_

## `heroku ci:config:unset`

unset CI config vars

```
USAGE
  $ heroku ci:config:unset [--prompt] [-a <value>] [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  unset CI config vars

EXAMPLES
   $ heroku ci:config:unset RAILS_ENV
```

_See code: [src/commands/ci/config/unset.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/config/unset.ts)_

## `heroku ci:debug`

opens an interactive test debugging session with the contents of the current directory

```
USAGE
  $ heroku ci:debug [--prompt] [-a <value>] [--no-cache] [--no-setup] [-p <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
      --no-cache          start test run with an empty cache
      --no-setup          start test dyno without running test-setup

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  opens an interactive test debugging session with the contents of the current directory
```

_See code: [src/commands/ci/debug.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/debug.ts)_

## `heroku ci:info TEST-RUN`

show the status of a specific test run

```
USAGE
  $ heroku ci:info TEST-RUN [--prompt] [-a <value>] [--node <value>] [-p <value>] [-r <value>]

ARGUMENTS
  TEST-RUN  auto-incremented test run number

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use
      --node=<value>      the node number to show its setup and output

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  show the status of a specific test run

EXAMPLES
   $ heroku ci:info 1288 --app murmuring-headland-14719
```

_See code: [src/commands/ci/info.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/info.ts)_

## `heroku ci:last`

looks for the most recent run and returns the output of that run

```
USAGE
  $ heroku ci:last [--prompt] [-a <value>] [--node <value>] [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use
      --node=<value>      the node number to show its setup and output

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  looks for the most recent run and returns the output of that run

EXAMPLES
   $ heroku ci:last --pipeline=my-pipeline --node 100
```

_See code: [src/commands/ci/last.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/last.ts)_

## `heroku ci:migrate-manifest`

app-ci.json is deprecated. Run this command to migrate to app.json with an environments key.

```
USAGE
  $ heroku ci:migrate-manifest

DESCRIPTION
  app-ci.json is deprecated. Run this command to migrate to app.json with an environments key.

EXAMPLES
   $ heroku ci:migrate-manifest
```

_See code: [src/commands/ci/migrate-manifest.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/migrate-manifest.ts)_

## `heroku ci:open`

open the Dashboard version of Heroku CI

```
USAGE
  $ heroku ci:open [--prompt] [-a <value>] [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  open the Dashboard version of Heroku CI

EXAMPLES
   $ heroku ci:open --app murmuring-headland-14719
```

_See code: [src/commands/ci/open.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/open.ts)_

## `heroku ci:rerun [NUMBER]`

rerun tests against current directory

```
USAGE
  $ heroku ci:rerun [NUMBER] [--prompt] [-a <value>] [-p <value>] [-r <value>]

ARGUMENTS
  [NUMBER]  auto-incremented test run number

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  rerun tests against current directory

EXAMPLES
   $ heroku ci:rerun 985 --app murmuring-headland-14719
```

_See code: [src/commands/ci/rerun.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/rerun.ts)_

## `heroku ci:run`

run tests against current directory

```
USAGE
  $ heroku ci:run [--prompt] [-a <value>] [-p <value>] [-r <value>]

FLAGS
  -a, --app=<value>       app to run command against
  -p, --pipeline=<value>  name of pipeline
  -r, --remote=<value>    git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  run tests against current directory

EXAMPLES
   $ heroku ci:run --app murmuring-headland-14719
```

_See code: [src/commands/ci/run.ts](https://github.com/heroku/cli/blob/v11.0.1-alpha.1/src/commands/ci/run.ts)_
