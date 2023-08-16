`heroku sessions`
=================

OAuth sessions

* [`heroku sessions`](#heroku-sessions)
* [`heroku sessions:destroy ID`](#heroku-sessionsdestroy-id)

## `heroku sessions`

list your OAuth sessions

```
USAGE
  $ heroku sessions [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  list your OAuth sessions
```

_See code: [src/commands/sessions/index.ts](https://github.com/heroku/cli/blob/v8.3.0/src/commands/sessions/index.ts)_

## `heroku sessions:destroy ID`

delete (logout) OAuth session by ID

```
USAGE
  $ heroku sessions:destroy ID

DESCRIPTION
  delete (logout) OAuth session by ID
```

_See code: [src/commands/sessions/destroy.ts](https://github.com/heroku/cli/blob/v8.3.0/src/commands/sessions/destroy.ts)_
