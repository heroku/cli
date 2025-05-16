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
  $ heroku features -a <value> [-r <value>] [--json]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

DESCRIPTION
  list available app features
```

_See code: [src/commands/features/index.ts](https://github.com/heroku/cli/blob/v10.7.0-alpha.0/packages/cli/src/commands/features/index.ts)_

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE -a <value> [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disables an app feature
```

_See code: [src/commands/features/disable.ts](https://github.com/heroku/cli/blob/v10.7.0-alpha.0/packages/cli/src/commands/features/disable.ts)_

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE -a <value> [-r <value>]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an app feature
```

_See code: [src/commands/features/enable.ts](https://github.com/heroku/cli/blob/v10.7.0-alpha.0/packages/cli/src/commands/features/enable.ts)_

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE -a <value> [-r <value>] [--json]

ARGUMENTS
  FEATURE  unique identifier or name of the app feature

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            output in json format

DESCRIPTION
  display information about a feature
```

_See code: [src/commands/features/info.ts](https://github.com/heroku/cli/blob/v10.7.0-alpha.0/packages/cli/src/commands/features/info.ts)_
