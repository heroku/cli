`heroku drains`
===============

forward logs to syslog or HTTPS

* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:get`](#heroku-drainsget)
* [`heroku drains:remove URL`](#heroku-drainsremove-url)
* [`heroku drains:set URL`](#heroku-drainsset-url)

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains -a <value> [-r <value>] [--json]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

DESCRIPTION
  display the log drains of an app
```

_See code: [src/commands/drains/index.ts](https://github.com/heroku/cli/blob/v10.0.0-alpha.1/packages/cli/src/commands/drains/index.ts)_

## `heroku drains:add URL`

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  adds a log drain to an app
```

_See code: [src/commands/drains/add.ts](https://github.com/heroku/cli/blob/v10.0.0-alpha.1/packages/cli/src/commands/drains/add.ts)_

## `heroku drains:get`

display the log drain for a space

```
USAGE
  $ heroku drains:get -s <value> [--json]

FLAGS
  -s, --space=<value>  (required) space for which to get log drain
      --json           output in json format

DESCRIPTION
  display the log drain for a space

ALIASES
  $ heroku drains:get
```

## `heroku drains:remove URL`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove URL -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  removes a log drain from an app

EXAMPLES
  drains:remove [URL|TOKEN]
```

_See code: [src/commands/drains/remove.ts](https://github.com/heroku/cli/blob/v10.0.0-alpha.1/packages/cli/src/commands/drains/remove.ts)_

## `heroku drains:set URL`

replaces the log drain for a space

```
USAGE
  $ heroku drains:set URL -s <value>

FLAGS
  -s, --space=<value>  (required) space for which to set log drain

DESCRIPTION
  replaces the log drain for a space

ALIASES
  $ heroku drains:set
```
