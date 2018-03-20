heroku labs
===========

experimental features
# Commands

* [heroku labs [OPTIONS]](#labs)
* [heroku labs:disable [FEATURE] [OPTIONS]](#labsdisable)
* [heroku labs:enable FEATURE [OPTIONS]](#labsenable)
* [heroku labs:info FEATURE [OPTIONS]](#labsinfo)
## labs

list experimental features

```
USAGE
  $ heroku labs [OPTIONS]

OPTIONS
  -a, --app=app        [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json
```

### labs:disable

disables an experimental feature

```
USAGE
  $ heroku labs:disable [FEATURE] [OPTIONS]

OPTIONS
  -a, --app=app        [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  --confirm=confirm
```

### labs:enable

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE [OPTIONS]

OPTIONS
  -a, --app=app        [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
```

### labs:info

show feature info

```
USAGE
  $ heroku labs:info FEATURE [OPTIONS]

OPTIONS
  -a, --app=app        [default: foobar] app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json
```
