@heroku-cli/plugin-git
======================

Heroku CLI plugin to manage local git repos.

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-git.svg)](https://npmjs.org/package/@heroku-cli/plugin-git)
[![CircleCI](https://circleci.com/gh/[object Object]/tree/master.svg?style=shield)](https://circleci.com/gh/[object Object]/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/[object Object]?branch=master&svg=true)](https://ci.appveyor.com/project/[object Object]/branch/master)
[![Codecov](https://codecov.io/gh/[object Object]/branch/master/graph/badge.svg)](https://codecov.io/gh/[object Object])
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-git.svg)](https://npmjs.org/package/@heroku-cli/plugin-git)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-git.svg)](https://github.com/[object Object]/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-git
$ oclif-example COMMAND
running command...
$ oclif-example (-v|--version|version)
@heroku-cli/plugin-git/7.47.10 darwin-x64 node-v12.18.4
$ oclif-example --help [COMMAND]
USAGE
  $ oclif-example COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`oclif-example git:clone [DIRECTORY]`](#oclif-example-gitclone-directory)
* [`oclif-example git:remote`](#oclif-example-gitremote)

## `oclif-example git:clone [DIRECTORY]`

clones a heroku app to your local machine at DIRECTORY (defaults to app name)

```
USAGE
  $ oclif-example git:clone [DIRECTORY]

ARGUMENTS
  DIRECTORY  where to clone the app

OPTIONS
  -a, --app=app        (required) the Heroku app to use
  -r, --remote=remote  the git remote to create, default "heroku"
  --ssh-git            use SSH git protocol

EXAMPLES
  $ heroku git:clone -a example
  Cloning into 'example'...
  remote: Counting objects: 42, done.
  ...
```

_See code: [src/commands/git/clone.ts](https://github.com/heroku/cli/blob/v7.47.10/packages/git/src/commands/git/clone.ts)_

## `oclif-example git:remote`

adds a git remote to an app repo

```
USAGE
  $ oclif-example git:remote

OPTIONS
  -a, --app=app        the Heroku app to use
  -r, --remote=remote  the git remote to create
  --ssh-git            use SSH git protocol

DESCRIPTION
  extra arguments will be passed to git remote add

EXAMPLES
  # set git remote heroku to https://git.heroku.com/example.git
       $ heroku git:remote -a example

       # set git remote heroku-staging to https://git.heroku.com/example.git
       $ heroku git:remote --remote heroku-staging -a example
```

_See code: [src/commands/git/remote.ts](https://github.com/heroku/cli/blob/v7.47.10/packages/git/src/commands/git/remote.ts)_
<!-- commandsstop -->
