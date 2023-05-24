@heroku-cli/plugin-ps
=====================

ps core plugin for Heroku CLI

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-ps.svg)](https://npmjs.org/package/@heroku-cli/plugin-ps)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-ps/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-ps/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-ps?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-ps/branch/master)
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
  $ heroku ps:autoscale:disable -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disable web dyno autoscaling
```

_See code: [src/commands/ps/autoscale/disable.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ps/src/commands/ps/autoscale/disable.ts)_

## `heroku ps:autoscale:enable`

enable web dyno autoscaling

```
USAGE
  $ heroku ps:autoscale:enable -a <value> --min <value> --max <value> [-r <value>] [--p95 <value>] [--notifications]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --max=<value>         (required) maximum number of dynos
  --min=<value>         (required) minimum number of dynos
  --notifications       receive email notifications when the max dyno limit is reached
  --p95=<value>         desired p95 response time

DESCRIPTION
  enable web dyno autoscaling
```

_See code: [src/commands/ps/autoscale/enable.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ps/src/commands/ps/autoscale/enable.ts)_

## `heroku ps:wait`

wait for all dynos to be running latest version after a release

```
USAGE
  $ heroku ps:wait -a <value> [-r <value>] [-w <value>] [-R | -t <value>]

FLAGS
  -R, --with-run               whether to wait for one-off run dynos
  -a, --app=<value>            (required) app to run command against
  -r, --remote=<value>         git remote of app to use
  -t, --type=<value>           wait for one specific dyno type
  -w, --wait-interval=<value>  [default: 10] how frequently to poll in seconds (to avoid hitting Heroku API rate limits)

DESCRIPTION
  wait for all dynos to be running latest version after a release
```

_See code: [src/commands/ps/wait.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ps/src/commands/ps/wait.ts)_

## `heroku regions`

list available regions for deployment

```
USAGE
  $ heroku regions [--json] [--private] [--common]

FLAGS
  --common   show regions for common runtime
  --json     output in json format
  --private  show regions for private spaces

DESCRIPTION
  list available regions for deployment
```

_See code: [src/commands/regions.ts](https://github.com/heroku/cli/blob/v8.1.4/packages/ps/src/commands/regions.ts)_
<!-- commandsstop -->
