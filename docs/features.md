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
  $ heroku features

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```
