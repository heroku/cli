heroku drains
=============

Heroku CLI plugin to manage apps.
# Commands

* [heroku drains [OPTIONS]](#drains)
* [heroku drains:add URL [OPTIONS]](#drainsadd)
* [heroku drains:remove [URL|TOKEN]](#drainsremove)
## drains

display the log drains of an app

```
USAGE
  $ heroku drains [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

### drains:add

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### drains:remove

removes a log drain from an app

```
USAGE
  $ heroku drains:remove [URL|TOKEN]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
