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
  $ heroku labs [--prompt] [-a <value>] [--json] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            display as json

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list experimental features
```

_See code: [src/commands/labs/index.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.33/src/commands/labs/index.ts)_

## `heroku labs:disable FEATURE`

disables an experimental feature

```
USAGE
  $ heroku labs:disable FEATURE [--prompt] [-a <value>] [--confirm <value>] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>      app to run command against
  -r, --remote=<value>   git remote of app to use
  --confirm=<value>

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  disables an experimental feature
```

_See code: [src/commands/labs/disable.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.33/src/commands/labs/disable.ts)_

## `heroku labs:enable FEATURE`

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE [--prompt] [-a <value>] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  enables an experimental feature
```

_See code: [src/commands/labs/enable.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.33/src/commands/labs/enable.ts)_

## `heroku labs:info FEATURE`

show feature info

```
USAGE
  $ heroku labs:info FEATURE [--prompt] [-a <value>] [--json] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the account feature

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            display as json

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  show feature info
```

_See code: [src/commands/labs/info.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.33/src/commands/labs/info.ts)_
