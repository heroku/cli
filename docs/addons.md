heroku addons
=============


# Commands

* [heroku addons [--all|--app APP]](#addons)
* [heroku addons:attach ADDON_NAME [OPTIONS]](#addonsattach)
* [heroku addons:create SERVICE:PLAN [OPTIONS]](#addonscreate)
* [heroku addons:destroy [OPTIONS]](#addonsdestroy)
* [heroku addons:detach ATTACHMENT_NAME [OPTIONS]](#addonsdetach)
* [heroku addons:docs ADDON [OPTIONS]](#addonsdocs)
* [heroku addons:downgrade ADDON [PLAN] [OPTIONS]](#addonsdowngrade)
* [heroku addons:info ADDON](#addonsinfo)
* [heroku addons:open ADDON [OPTIONS]](#addonsopen)
* [heroku addons:plans SERVICE [OPTIONS]](#addonsplans)
* [heroku addons:rename ADDON NEW_NAME](#addonsrename)
* [heroku addons:services [OPTIONS]](#addonsservices)
* [heroku addons:upgrade ADDON [PLAN] [OPTIONS]](#addonsupgrade)
* [heroku addons:wait ADDON](#addonswait)
## addons

lists your add-ons and attachments

```
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

  Examples:

       $ heroku addons --all
       $ heroku addons --app acme-inc-www
```

### addons:attach

attach add-on resource to a new app

```
USAGE
  $ heroku addons:attach ADDON_NAME [OPTIONS]

OPTIONS
  -a, --app=app            (required) app to run command against
  -r, --remote=remote      git remote of app to use
  --as=as                  name for add-on attachment
  --confirm=confirm        overwrite existing add-on attachment with same name
  --credential=credential  credential name for scoped access to Heroku Postgres
```

### addons:create

create an add-on resource

```
USAGE
  $ heroku addons:create SERVICE:PLAN [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --as=as              name for the initial add-on attachment
  --confirm=confirm    overwrite existing config vars or existing add-on attachments
  --name=name          name for the add-on resource
  --wait               watch add-on creation status and exit when complete
```

### addons:destroy

destroy add-on resources

```
USAGE
  $ heroku addons:destroy [OPTIONS]

OPTIONS
  -a, --app=app          app to run command against
  -c, --confirm=confirm
  -f, --force            allow destruction even if connected to other apps
  -r, --remote=remote    git remote of app to use
```

### addons:detach

detach an add-on resource from an app

```
USAGE
  $ heroku addons:detach ATTACHMENT_NAME [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### addons:docs

open an add-on's Dev Center documentation in your browser

```
USAGE
  $ heroku addons:docs ADDON [OPTIONS]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --show-url           show URL, do not open browser
```

### addons:downgrade

change add-on plan

```
USAGE
  $ heroku addons:downgrade ADDON [PLAN] [OPTIONS]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
  Either one can be used to change an add-on plan up or down.

  [https://devcenter.heroku.com/articles/managing-add-ons](https://devcenter.heroku.com/articles/managing-add-ons)

  Examples:

     Upgrade an add-on by service name:

       $ heroku addons:upgrade heroku-redis:premium-2

     Upgrade a specific add-on:

       $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

### addons:info

Show info about an add-on and its attachments.

```
USAGE
  $ heroku addons:info ADDON

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
```

### addons:open

open an add-on's dashboard in your browser

```
USAGE
  $ heroku addons:open ADDON [OPTIONS]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --show-url           show URL, do not open browser
```

### addons:plans

list all available plans for an add-on services

```
USAGE
  $ heroku addons:plans SERVICE [OPTIONS]

OPTIONS
  --json  output in json format
```

### addons:rename

Rename an add-on.

```
USAGE
  $ heroku addons:rename ADDON NEW_NAME

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
```

### addons:services

list all available add-on services

```
USAGE
  $ heroku addons:services [OPTIONS]

OPTIONS
  --json  output in json format
```

### addons:upgrade

change add-on plan

```
USAGE
  $ heroku addons:upgrade ADDON [PLAN] [OPTIONS]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.
  Either one can be used to change an add-on plan up or down.

  [https://devcenter.heroku.com/articles/managing-add-ons](https://devcenter.heroku.com/articles/managing-add-ons)

  Examples:

     Upgrade an add-on by service name:

       $ heroku addons:upgrade heroku-redis:premium-2

     Upgrade a specific add-on:

       $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

### addons:wait

Show provisioning status of the add-ons on the app

```
USAGE
  $ heroku addons:wait ADDON

OPTIONS
  -a, --app=app                  app to run command against
  -r, --remote=remote            git remote of app to use
  --wait-interval=wait-interval  how frequently to poll in seconds
```
