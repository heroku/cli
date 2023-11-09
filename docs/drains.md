`heroku drains`
===============

forward logs to syslog or HTTPS

* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:remove URL`](#heroku-drainsremove-url)

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains -a <value> [--json]

FLAGS
  -a, --app=<value>  (required) app to run command against
  --json             output in json format

DESCRIPTION
  display the log drains of an app
```

_See code: [src/commands/drains/index.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/drains/index.ts)_

## `heroku drains:add URL`

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  adds a log drain to an app
```

_See code: [src/commands/drains/add.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/drains/add.ts)_

## `heroku drains:remove URL`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove URL -a <value>

FLAGS
  -a, --app=<value>  (required) app to run command against

DESCRIPTION
  removes a log drain from an app

EXAMPLES
  drains:remove [URL|TOKEN]
```

_See code: [src/commands/drains/remove.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/drains/remove.ts)_
