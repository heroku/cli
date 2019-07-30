`heroku buildpacks`
===================

scripts used to compile apps

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

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/index.ts)_

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

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/add.ts)_

## `heroku buildpacks:clear`

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/clear.ts)_

## `heroku buildpacks:info BUILDPACK`

fetch info about a buildpack

```
USAGE
  $ heroku buildpacks:info BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack
```

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/info.ts)_

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

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/remove.ts)_

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

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/search.ts)_

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

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/set.ts)_

## `heroku buildpacks:versions BUILDPACK`

list versions of a buildpack

```
USAGE
  $ heroku buildpacks:versions BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack
```

_See code: [@heroku-cli/plugin-buildpacks](https://github.com/heroku/cli/blob/v7.27.0/packages/buildpacks/src/commands/buildpacks/versions.ts)_
