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
  $ heroku buildpacks -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  display the buildpacks for an app
```

## `heroku buildpacks:add BUILDPACK`

add new app buildpack, inserting into list of buildpacks if necessary

```
USAGE
  $ heroku buildpacks:add BUILDPACK -a <value> [-r <value>] [-i <value>]

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -i, --index=<value>   the 1-based index of the URL in the list of URLs
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  add new app buildpack, inserting into list of buildpacks if necessary
```

## `heroku buildpacks:clear`

clear all buildpacks set on the app

```
USAGE
  $ heroku buildpacks:clear -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  clear all buildpacks set on the app
```

## `heroku buildpacks:info BUILDPACK`

fetch info about a buildpack

```
USAGE
  $ heroku buildpacks:info BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

DESCRIPTION
  fetch info about a buildpack
```

## `heroku buildpacks:remove [BUILDPACK]`

remove a buildpack set on the app

```
USAGE
  $ heroku buildpacks:remove [BUILDPACK] -a <value> [-r <value>] [-i <value>]

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -i, --index=<value>   the 1-based index of the URL to remove from the list of URLs
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  remove a buildpack set on the app
```

## `heroku buildpacks:search [TERM]`

search for buildpacks

```
USAGE
  $ heroku buildpacks:search [TERM] [--namespace <value>] [--name <value>] [--description <value>]

ARGUMENTS
  TERM  search term that searches across name, namespace, and description

FLAGS
  --description=<value>  buildpack description to filter on
  --name=<value>         buildpack names to filter on using a comma separated list
  --namespace=<value>    buildpack namespaces to filter on using a comma separated list

DESCRIPTION
  search for buildpacks
```

## `heroku buildpacks:set BUILDPACK`

```
USAGE
  $ heroku buildpacks:set BUILDPACK -a <value> [-r <value>] [-i <value>]

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

FLAGS
  -a, --app=<value>     (required) [default: myapp] app to run command against
  -i, --index=<value>   the 1-based index of the URL in the list of URLs
  -r, --remote=<value>  git remote of app to use
```

## `heroku buildpacks:versions BUILDPACK`

list versions of a buildpack

```
USAGE
  $ heroku buildpacks:versions BUILDPACK

ARGUMENTS
  BUILDPACK  namespace/name of the buildpack

DESCRIPTION
  list versions of a buildpack
```
