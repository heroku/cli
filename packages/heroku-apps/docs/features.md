heroku features
===============

manage optional features
# Commands

* [heroku features [OPTIONS]](#features)
* [heroku features:disable FEATURE [OPTIONS]](#featuresdisable)
* [heroku features:enable FEATURE [OPTIONS]](#featuresenable)
* [heroku features:info FEATURE [OPTIONS]](#featuresinfo)
## features

list available app features

```
USAGE
  $ heroku features [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

### features:disable

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### features:enable

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### features:info

display information about a feature

```
USAGE
  $ heroku features:info FEATURE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```
