@heroku-cli/plugin-ps
=====================

ps core plugin for Heroku CLI

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-ps.svg)](https://npmjs.org/package/@heroku-cli/plugin-ps)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-ps/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-ps/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-ps?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-ps/branch/master)
[![Codecov](https://codecov.io/gh/heroku/heroku-cli-plugin-ps/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-cli-plugin-ps)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-ps.svg)](https://npmjs.org/package/@heroku-cli/plugin-ps)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-ps.svg)](https://github.com/heroku/heroku-cli-plugin-ps/blob/master/package.json)

<!-- toc -->
* [Commands](#commands)
<!-- tocstop -->
# Commands
<!-- commands -->
* [`heroku ps:autoscale:disable`](#heroku-psautoscaledisable)
* [`heroku ps:autoscale:enable`](#heroku-psautoscaleenable)
* [`heroku ps:wait`](#heroku-pswait)
* [`heroku regions`](#heroku-regions)

## `heroku ps:autoscale:disable`

disable web dyno autoscaling

```
USAGE
  $ heroku ps:autoscale:disable

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/ps/autoscale/disable.ts](https://github.com/heroku/cli/blob/v7.39.2/packages/ps/src/commands/ps/autoscale/disable.ts)_

## `heroku ps:autoscale:enable`

enable web dyno autoscaling

```
USAGE
  $ heroku ps:autoscale:enable

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --max=max            (required) maximum number of dynos
  --min=min            (required) minimum number of dynos
  --notifications      receive email notifications when the max dyno limit is reached
  --p95=p95            desired p95 response time
```

_See code: [src/commands/ps/autoscale/enable.ts](https://github.com/heroku/cli/blob/v7.39.2/packages/ps/src/commands/ps/autoscale/enable.ts)_

## `heroku ps:wait`

wait for all dynos to be running latest version after a release

```
USAGE
  $ heroku ps:wait

OPTIONS
  -R, --with-run                     whether to wait for one-off run dynos
  -a, --app=app                      (required) app to run command against
  -r, --remote=remote                git remote of app to use
  -t, --type=type                    wait for one specific dyno type

  -w, --wait-interval=wait-interval  [default: 10] how frequently to poll in seconds (to avoid hitting Heroku API rate
                                     limits)
```

_See code: [src/commands/ps/wait.ts](https://github.com/heroku/cli/blob/v7.39.2/packages/ps/src/commands/ps/wait.ts)_

## `heroku regions`

list available regions for deployment

```
USAGE
  $ heroku regions

OPTIONS
  --common   show regions for common runtime
  --json     output in json format
  --private  show regions for private spaces
```

_See code: [src/commands/regions.ts](https://github.com/heroku/cli/blob/v7.39.2/packages/ps/src/commands/regions.ts)_
<!-- commandsstop -->
