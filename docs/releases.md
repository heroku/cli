`heroku releases`
=================

display the releases for an app

* [`heroku releases`](#heroku-releases)
* [`heroku releases:info [RELEASE]`](#heroku-releasesinfo-release)
* [`heroku releases:output [RELEASE]`](#heroku-releasesoutput-release)
* [`heroku releases:rollback [RELEASE]`](#heroku-releasesrollback-release)

## `heroku releases`

display the releases for an app

```
USAGE
  $ heroku releases

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --num=num        number of releases to show
  -r, --remote=remote  git remote of app to use
  --json               output releases in json format

EXAMPLES
  $ heroku releases
  === example Releases
  v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
  v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
  v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)
```

## `heroku releases:info [RELEASE]`

view detailed information for a release

```
USAGE
  $ heroku releases:info [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output in shell format
  --json               output in json format
```

## `heroku releases:output [RELEASE]`

View the release command output

```
USAGE
  $ heroku releases:output [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku releases:rollback [RELEASE]`

rollback to a previous release

```
USAGE
  $ heroku releases:rollback [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  If RELEASE is not specified, it will rollback one release
```
