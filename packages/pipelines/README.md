reviewapps
==========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/reviewapps.svg)](https://npmjs.org/package/reviewapps)
[![CircleCI](https://circleci.com/gh/jmar910/reviewapps/tree/master.svg?style=shield)](https://circleci.com/gh/jmar910/reviewapps/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/jmar910/reviewapps?branch=master&svg=true)](https://ci.appveyor.com/project/jmar910/reviewapps/branch/master)
[![Codecov](https://codecov.io/gh/jmar910/reviewapps/branch/master/graph/badge.svg)](https://codecov.io/gh/jmar910/reviewapps)
[![Downloads/week](https://img.shields.io/npm/dw/reviewapps.svg)](https://npmjs.org/package/reviewapps)
[![License](https://img.shields.io/npm/l/reviewapps.svg)](https://github.com/jmar910/reviewapps/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-pipelines
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-pipelines/7.28.0 darwin-x64 node-v10.2.1
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)
* [`heroku reviewapps:enable`](#heroku-reviewappsenable)

## `heroku reviewapps:disable`

disable review apps or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of app to use
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps

EXAMPLE
  $ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
```

_See code: [src/commands/reviewapps/disable.ts](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/disable.ts)_

## `heroku reviewapps:enable`

enable review apps and/or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:enable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  --autodeploy             autodeploy the review app
  --autodestroy            autodestroy the review app

EXAMPLE
  $ heroku reviewapps:enable -p mypipeline -a myapp --autodeploy --autodestroy
```

_See code: [src/commands/reviewapps/enable.ts](https://github.com/heroku/heroku-cli-plugin-pipelines/blob/v7.28.0/src/commands/reviewapps/enable.ts)_
<!-- commandsstop -->
