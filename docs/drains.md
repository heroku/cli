`heroku drains`
===============

forward logs to syslog or HTTPS

* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:remove [URL|TOKEN]`](#heroku-drainsremove-urltoken)

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  display the log drains of an app
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/index.js)_

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

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/add.js)_

## `heroku drains:remove [URL|TOKEN]`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove [URL|TOKEN]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  removes a log drain from an app
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/remove.js)_
