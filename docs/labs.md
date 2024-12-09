`heroku labs`
=============

add/remove experimental features

* [`heroku labs`](#heroku-labs)
* [`heroku labs:disable FEATURE`](#heroku-labsdisable-feature)
* [`heroku labs:enable FEATURE`](#heroku-labsenable-feature)
* [`heroku labs:info FEATURE`](#heroku-labsinfo-feature)

## `heroku labs`

list experimental features

```
USAGE
  $ heroku labs [-a <value>] [-r <value>] [--json]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            display as json

DESCRIPTION
  list experimental features
```

_See code: [src/commands/labs/index.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.4/packages/cli/src/commands/labs/index.ts)_

## `heroku labs:disable FEATURE`

disables an experimental feature

```
USAGE
  $ heroku labs:disable FEATURE [-a <value>] [-r <value>] [--confirm <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>      app to run command against
  -r, --remote=<value>   git remote of app to use
  --confirm=<value>

DESCRIPTION
  disables an experimental feature
```

_See code: [src/commands/labs/disable.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.4/packages/cli/src/commands/labs/disable.ts)_

## `heroku labs:enable FEATURE`

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE [-a <value>] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an experimental feature
```

_See code: [src/commands/labs/enable.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.4/packages/cli/src/commands/labs/enable.ts)_

## `heroku labs:info FEATURE`

show feature info

```
USAGE
  $ heroku labs:info FEATURE [-a <value>] [-r <value>] [--json]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            display as json

DESCRIPTION
  show feature info
```

_See code: [src/commands/labs/info.ts](https://github.com/heroku/cli/blob/v10.0.0-beta.4/packages/cli/src/commands/labs/info.ts)_
