@heroku-cli/plugin-buildpacks
=============================



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-buildpacks.svg)](https://npmjs.org/package/@heroku-cli/plugin-buildpacks)

[![CircleCI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/cli/tree/master)

[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/cli?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/cli/branch/master)
[![Codecov](https://codecov.io/gh/heroku/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-buildpacks.svg)](https://npmjs.org/package/@heroku-cli/plugin-buildpacks)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-buildpacks.svg)](https://github.com/heroku/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-buildpacks
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-buildpacks/7.43.0 darwin-x64 node-v12.15.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku buildpacks`](#heroku-buildpacks)
* [`heroku buildpacks:add BUILDPACK`](#heroku-buildpacksadd-buildpack)
* [`heroku buildpacks:clear`](#heroku-buildpacksclear)
* [`heroku buildpacks:info BUILDPACK`](#heroku-buildpacksinfo-buildpack)
* [`heroku buildpacks:remove [BUILDPACK]`](#heroku-buildpacksremove-buildpack)
* [`heroku buildpacks:search [TERM]`](#heroku-buildpackssearch-term)
* [`heroku buildpacks:set BUILDPACK`](#heroku-buildpacksset-buildpack)
* [`heroku buildpacks:versions BUILDPACK`](#heroku-buildpacksversions-buildpack)

## `heroku buildpacks`

display the buildpacks for an app

```
USAGE
  $ heroku buildpacks

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/buildpacks/index.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/index.ts)_

## `heroku buildpacks:add BUILDPACK`

add new app buildpack, inserting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:add BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/buildpacks/add.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/add.ts)_

## `heroku buildpacks:clear`

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/buildpacks/clear.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/clear.ts)_

## `heroku buildpacks:info BUILDPACK`

fetch info about a buildpack

```
USAGE
  $ heroku buildpacks:info BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack
```

_See code: [src/commands/buildpacks/info.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/info.ts)_

## `heroku buildpacks:remove [BUILDPACK]`

remove a buildpack set on the app

```
USAGE
  $ heroku buildpacks:remove [BUILDPACK]

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL to remove from the list of URLs
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/buildpacks/remove.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/remove.ts)_

## `heroku buildpacks:search [TERM]`

search for buildpacks

```
USAGE
  $ heroku buildpacks:search [TERM]

ARGUMENTS
  TERM  search term that searches across name, namespace, and description

OPTIONS
  --description=description  buildpack description to filter on
  --name=name                buildpack names to filter on using a comma separated list
  --namespace=namespace      buildpack namespaces to filter on using a comma separated list
```

_See code: [src/commands/buildpacks/search.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/search.ts)_

## `heroku buildpacks:set BUILDPACK`

```
USAGE
  $ heroku buildpacks:set BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

OPTIONS
  -a, --app=app        (required) app to run command against
  -i, --index=index    the 1-based index of the URL in the list of URLs
  -r, --remote=remote  git remote of app to use
```

_See code: [src/commands/buildpacks/set.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/set.ts)_

## `heroku buildpacks:versions BUILDPACK`

list versions of a buildpack

```
USAGE
  $ heroku buildpacks:versions BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack
```

_See code: [src/commands/buildpacks/versions.ts](https://github.com/heroku/cli/blob/v7.43.0/packages/buildpacks/src/commands/buildpacks/versions.ts)_
<!-- commandsstop -->
