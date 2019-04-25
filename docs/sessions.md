`heroku sessions`
=================

OAuth sessions

* [`heroku sessions`](#heroku-sessions)
* [`heroku sessions:destroy ID`](#heroku-sessionsdestroy-id)

## `heroku sessions`

list your OAuth sessions

```
USAGE
  $ heroku sessions

OPTIONS
  -j, --json  output in json format
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/sessions/index.js)_

## `heroku sessions:destroy ID`

delete (logout) OAuth session by ID

```
USAGE
  $ heroku sessions:destroy ID
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/sessions/destroy.js)_
