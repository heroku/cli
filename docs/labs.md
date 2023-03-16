`heroku labs`
=============

add/remove experimental features

* [`heroku labs`](#heroku-labs)
* [`heroku labs:enable FEATURE`](#heroku-labsenable-feature)
* [`heroku labs:info FEATURE`](#heroku-labsinfo-feature)

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
