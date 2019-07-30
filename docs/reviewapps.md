`heroku reviewapps`
===================

disposable apps built on GitHub pull requests

* [`heroku reviewapps:disable`](#heroku-reviewappsdisable)

## `heroku reviewapps:disable`

disable review apps or settings on an existing pipeline

```
USAGE
  $ heroku reviewapps:disable

OPTIONS
  -a, --app=app            (required) parent app used by review apps
  -p, --pipeline=pipeline  (required) name of pipeline
  -r, --remote=remote      git remote of parent app used by review apps
  --autodeploy             disable autodeployments
  --autodestroy            disable automatically destroying review apps

EXAMPLES
  $ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
  Disabling auto deployment ...
  Configuring pipeline... done
```
