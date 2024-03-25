# `heroku labs`

add/remove experimental features

- [`heroku labs`](#heroku-labs)
- [`heroku labs:disable FEATURE`](#heroku-labsdisable-feature)
- [`heroku labs:enable FEATURE`](#heroku-labsenable-feature)
- [`heroku labs:info FEATURE`](#heroku-labsinfo-feature)

## `heroku labs`

list experimental features

```
USAGE
  $ heroku labs [--json] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                display as json

DESCRIPTION
  list experimental features
```

## `heroku labs:disable FEATURE`

disables an experimental feature

```
USAGE
  $ heroku labs:disable FEATURE [-a <value>] [-r <value>] [--confirm <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --confirm=<value>

DESCRIPTION
  disables an experimental feature
```

_See code: [src/commands/labs/disable.ts](https://github.com/heroku/cli/blob/v8.11.1-beta.4/src/commands/labs/disable.ts)_

## `heroku labs:enable FEATURE`

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an experimental feature
```

## `heroku labs:info FEATURE`

show feature info

```
USAGE
  $ heroku labs:info FEATURE [--json] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                display as json

DESCRIPTION
  show feature info
```
