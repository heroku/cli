`heroku features`
=================

add/remove app features

* [`heroku features`](#heroku-features)
* [`heroku features:disable FEATURE`](#heroku-featuresdisable-feature)
* [`heroku features:enable FEATURE`](#heroku-featuresenable-feature)
* [`heroku features:info FEATURE`](#heroku-featuresinfo-feature)

## `heroku features`

list available app features

```
USAGE
  $ heroku features -a <value> [--prompt] [-r <value>] [--json]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list available app features
```

_See code: [src/commands/features/index.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.36/src/commands/features/index.ts)_

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE -a <value> [--prompt] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  disables an app feature
```

_See code: [src/commands/features/disable.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.36/src/commands/features/disable.ts)_

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE -a <value> [--prompt] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  enables an app feature
```

_See code: [src/commands/features/enable.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.36/src/commands/features/enable.ts)_

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE -a <value> [--prompt] [--json] [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display information about a feature
```

_See code: [src/commands/features/info.ts](https://github.com/heroku/cli/blob/v11.0.0-alpha.36/src/commands/features/info.ts)_
