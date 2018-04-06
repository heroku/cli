@heroku-cli/plugin-auth
=======================

auth core plugin for Heroku CLI

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-auth.svg)](https://npmjs.org/package/@heroku-cli/plugin-auth)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-auth/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-auth/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-auth?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-auth/branch/master)
[![Codecov](https://codecov.io/gh/heroku/heroku-cli-plugin-auth/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-cli-plugin-auth)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-auth.svg)](https://npmjs.org/package/@heroku-cli/plugin-auth)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-auth.svg)](https://github.com/heroku/heroku-cli-plugin-auth/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-auth
$ oclif-example COMMAND
running command...
$ oclif-example (-v|--version|version)
@heroku-cli/plugin-auth/0.1.0 linux-x64 node-v9.10.1
$ oclif-example --help [COMMAND]
USAGE
  $ oclif-example COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [oclif-example auth:whoami](#oclif-example-authwhoami)

## oclif-example auth:whoami

display the current logged in user

```
USAGE
  $ oclif-example auth:whoami

ALIASES
  $ oclif-example whoami
```

_See code: [src/commands/auth/whoami.ts](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.1.0/src/commands/auth/whoami.ts)_
<!-- commandsstop -->
