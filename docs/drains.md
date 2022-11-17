`heroku drains`
===============

forward logs to syslog or HTTPS

* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:remove [URL|TOKEN]`](#heroku-drainsremove-urltoken)

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku drains:add URL`

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku drains:remove [URL|TOKEN]`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove [URL|TOKEN]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
