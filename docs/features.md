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
  $ heroku features -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  list available app features
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/index.js)_

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disables an app feature
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/disable.js)_

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an app feature
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/enable.js)_

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  display information about a feature
```

_See code: [@heroku-cli/plugin-apps-v5](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/info.js)_
