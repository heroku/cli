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
  $ heroku releases -a <value> [-n <value>] [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --num=<value>     number of releases to show
  -r, --remote=<value>  git remote of app to use
      --json            output releases in json format

DESCRIPTION
  display the releases for an app

EXAMPLES
  v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)

  v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)

  v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)
```

_See code: [src/commands/releases/index.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/releases/index.ts)_

## `heroku releases:info [RELEASE]`

view detailed information for a release

```
USAGE
  $ heroku releases:info [RELEASE] -a <value> [--json] [-s] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --shell           output in shell format
      --json            output in json format

DESCRIPTION
  view detailed information for a release
```

_See code: [src/commands/releases/info.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/releases/info.ts)_

## `heroku releases:output [RELEASE]`

View the release command output

```
USAGE
  $ heroku releases:output [RELEASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  View the release command output
```

_See code: [src/commands/releases/output.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/releases/output.ts)_

## `heroku releases:rollback [RELEASE]`

Roll back to a previous release.

```
USAGE
  $ heroku releases:rollback [RELEASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Roll back to a previous release.

  If RELEASE is not specified, it will roll back one release.
```

_See code: [src/commands/releases/rollback.ts](https://github.com/heroku/cli/blob/v9.3.2/packages/cli/src/commands/releases/rollback.ts)_
