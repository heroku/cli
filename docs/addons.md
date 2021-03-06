`heroku addons`
===============

tools and services for developing, extending, and operating your app

* [`heroku addons [--all|--app APP]`](#heroku-addons---all--app-app)
* [`heroku addons:attach ADDON_NAME`](#heroku-addonsattach-addon_name)
* [`heroku addons:create SERVICE:PLAN`](#heroku-addonscreate-serviceplan)
* [`heroku addons:destroy [ADDON]... [flags]`](#heroku-addonsdestroy-addon-flags)
* [`heroku addons:detach ATTACHMENT_NAME`](#heroku-addonsdetach-attachment_name)
* [`heroku addons:docs ADDON`](#heroku-addonsdocs-addon)
* [`heroku addons:downgrade ADDON [PLAN]`](#heroku-addonsdowngrade-addon-plan)
* [`heroku addons:info ADDON`](#heroku-addonsinfo-addon)
* [`heroku addons:open ADDON`](#heroku-addonsopen-addon)
* [`heroku addons:plans SERVICE`](#heroku-addonsplans-service)
* [`heroku addons:rename ADDON NEW_NAME`](#heroku-addonsrename-addon-new_name)
* [`heroku addons:services`](#heroku-addonsservices)
* [`heroku addons:upgrade ADDON [PLAN]`](#heroku-addonsupgrade-addon-plan)
* [`heroku addons:wait ADDON`](#heroku-addonswait-addon)

## `heroku addons [--all|--app APP]`

lists your add-ons and attachments

```
lists your add-ons and attachments
The default filter applied depends on whether you are in a Heroku app
directory. If so, the --app flag is implied. If not, the default of --all
is implied. Explicitly providing either flag overrides the default
behavior.

USAGE
  $ heroku addons [--all|--app APP]

OPTIONS
  -A, --all            show add-ons and attachments for all accessible apps
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --json               return add-ons in json format

DESCRIPTION
  The default filter applied depends on whether you are in a Heroku app
  directory. If so, the --app flag is implied. If not, the default of --all
  is implied. Explicitly providing either flag overrides the default
  behavior.

EXAMPLES
  $ heroku addons --all
  $ heroku addons --app acme-inc-www
```

## `heroku addons:attach ADDON_NAME`

attach an existing add-on resource to an app

```
attach an existing add-on resource to an app


USAGE
  $ heroku addons:attach ADDON_NAME

OPTIONS
  -a, --app=app            (required) app to run command against
  -r, --remote=remote      git remote of app to use
  --as=as                  name for add-on attachment
  --confirm=confirm        overwrite existing add-on attachment with same name
  --credential=credential  credential name for scoped access to Heroku Postgres
```

## `heroku addons:create SERVICE:PLAN`

create a new add-on resource

```
create a new add-on resource


USAGE
  $ heroku addons:create SERVICE:PLAN

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --as=as              name for the initial add-on attachment
  --confirm=confirm    overwrite existing config vars or existing add-on attachments
  --name=name          name for the add-on resource
  --wait               watch add-on creation status and exit when complete
```

## `heroku addons:destroy [ADDON]... [flags]`

permanently destroy an add-on resource

```
permanently destroy an add-on resource


USAGE
  $ heroku addons:destroy [ADDON]... [flags]

OPTIONS
  -a, --app=app          app to run command against
  -c, --confirm=confirm
  -f, --force            allow destruction even if connected to other apps
  -r, --remote=remote    git remote of app to use
```

## `heroku addons:detach ATTACHMENT_NAME`

detach an existing add-on resource from an app

```
detach an existing add-on resource from an app


USAGE
  $ heroku addons:detach ATTACHMENT_NAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku addons:docs ADDON`

open an add-on's Dev Center documentation in your browser

```
open an add-on's Dev Center documentation in your browser


USAGE
  $ heroku addons:docs ADDON

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --show-url           show URL, do not open browser
```

## `heroku addons:downgrade ADDON [PLAN]`

change add-on plan

```
change add-on plan
See available plans with `heroku addons:plans SERVICE`.

Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
Either one can be used to change an add-on plan up or down.

https://devcenter.heroku.com/articles/managing-add-ons

USAGE
  $ heroku addons:downgrade ADDON [PLAN]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
  Either one can be used to change an add-on plan up or down.

  https://devcenter.heroku.com/articles/managing-add-ons

EXAMPLE
  Upgrade an add-on by service name:
  $ heroku addons:upgrade heroku-redis:premium-2

  Upgrade a specific add-on:
  $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

## `heroku addons:info ADDON`

show detailed add-on resource and attachment information

```
show detailed add-on resource and attachment information


USAGE
  $ heroku addons:info ADDON

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku addons:open ADDON`

open an add-on's dashboard in your browser

```
open an add-on's dashboard in your browser


USAGE
  $ heroku addons:open ADDON

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --show-url           show URL, do not open browser
```

## `heroku addons:plans SERVICE`

list all available plans for an add-on services

```
list all available plans for an add-on services


USAGE
  $ heroku addons:plans SERVICE

OPTIONS
  --json  output in json format
```

## `heroku addons:rename ADDON NEW_NAME`

rename an add-on

```
rename an add-on


USAGE
  $ heroku addons:rename ADDON NEW_NAME

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku addons:services`

list all available add-on services

```
list all available add-on services


USAGE
  $ heroku addons:services

OPTIONS
  --json  output in json format
```

## `heroku addons:upgrade ADDON [PLAN]`

change add-on plan

```
change add-on plan
See available plans with `heroku addons:plans SERVICE`.

Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
Either one can be used to change an add-on plan up or down.

https://devcenter.heroku.com/articles/managing-add-ons

USAGE
  $ heroku addons:upgrade ADDON [PLAN]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
  Either one can be used to change an add-on plan up or down.

  https://devcenter.heroku.com/articles/managing-add-ons

EXAMPLE
  Upgrade an add-on by service name:
  $ heroku addons:upgrade heroku-redis:premium-2

  Upgrade a specific add-on:
  $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

## `heroku addons:wait ADDON`

show provisioning status of the add-ons on the app

```
show provisioning status of the add-ons on the app


USAGE
  $ heroku addons:wait ADDON

OPTIONS
  -a, --app=app                  app to run command against
  -r, --remote=remote            git remote of app to use
  --wait-interval=wait-interval  how frequently to poll in seconds
```
