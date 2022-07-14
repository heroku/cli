CLI Plugin for [Heroku Status](https://status.heroku.com)
===========

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-status.svg)](https://npmjs.org/package/@heroku-cli/plugin-status)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-status/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-cli-status/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-status?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-status/branch/master)
[![Greenkeeper](https://badges.greenkeeper.io/heroku/heroku-cli-status.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/npm/@heroku-cli/plugin-status/badge.svg)](https://snyk.io/test/npm/@heroku-cli/plugin-status)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-status.svg)](https://npmjs.org/package/@heroku-cli/plugin-status)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-status.svg)](https://github.com/heroku/heroku-cli-status/blob/master/package.json)

How to install this plugin
-------------------

This CLI comes built into the Heroku CLI. https://cli.heroku.com

Available commands
-------------------

```bash
$ heroku status
=== Heroku Status
Development: No known issues at this time.
Production: No known issues at this time.
```

or, if there were a real incident...

```bash
$ heroku status
=== Heroku Status
Development: Yellow
Production: Yellow

=== Increased Platform Latency 7:04:22 PM UTC
7:04:22 PM UTC (42 minutes ago) [Issue] We are experiencing a network connectivity issue with our upstream provider. We will post another update as to the status in an hour if not sooner.
```

More about https://devcenter.heroku.com/articles/heroku-status



<!-- install -->
# Install

with yarn:
```
$ yarn global add @heroku-cli/plugin-status
```

or with npm:
```
$ npm install -g @heroku-cli/plugin-status
```
<!-- installstop -->
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-status
$ @heroku-cli/plugin-status COMMAND
running command...
$ @heroku-cli/plugin-status (-v|--version|version)
@heroku-cli/plugin-status/7.60.0 darwin-x64 node-v14.18.2
$ @heroku-cli/plugin-status --help [COMMAND]
USAGE
  $ @heroku-cli/plugin-status COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`@heroku-cli/plugin-status status`](#heroku-cliplugin-status-status)

## `@heroku-cli/plugin-status status`

display current status of the Heroku platform

```
USAGE
  $ @heroku-cli/plugin-status status

OPTIONS
  --json  output in json format
```

_See code: [src/commands/status.ts](https://github.com/heroku/cli/blob/v7.60.0/packages/status/src/commands/status.ts)_
<!-- commandsstop -->
