`heroku addons`
===============

tools and services for developing, extending, and operating your app

* [`heroku addons [--all|--app APP]`](#heroku-addons---all--app-app)
* [`heroku addons:attach ADDON_NAME`](#heroku-addonsattach-addon_name)
* [`heroku addons:create SERVICE:PLAN`](#heroku-addonscreate-serviceplan)
* [`heroku addons:destroy ADDONNAME`](#heroku-addonsdestroy-addonname)
* [`heroku addons:detach ATTACHMENT_NAME`](#heroku-addonsdetach-attachment_name)
* [`heroku addons:docs ADDON`](#heroku-addonsdocs-addon)
* [`heroku addons:downgrade ADDON [PLAN]`](#heroku-addonsdowngrade-addon-plan)
* [`heroku addons:info ADDON`](#heroku-addonsinfo-addon)
* [`heroku addons:open ADDON`](#heroku-addonsopen-addon)
* [`heroku addons:plans SERVICE`](#heroku-addonsplans-service)
* [`heroku addons:rename ADDON_NAME NEW_NAME`](#heroku-addonsrename-addon_name-new_name)
* [`heroku addons:services`](#heroku-addonsservices)
* [`heroku addons:upgrade ADDON [PLAN]`](#heroku-addonsupgrade-addon-plan)
* [`heroku addons:wait [ADDON]`](#heroku-addonswait-addon)

## `heroku addons [--all|--app APP]`

Lists your add-ons and attachments.

```
USAGE
  $ heroku addons [--all|--app APP]

FLAGS
  -A, --all             show add-ons and attachments for all accessible apps
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            return add-ons in json format

DESCRIPTION
  Lists your add-ons and attachments.

  The default filter applied depends on whether you are in a Heroku app
  directory. If so, the --app flag is implied. If not, the default of --all
  is implied. Explicitly providing either flag overrides the default
  behavior.


EXAMPLES
  $ heroku addons --all

  $ heroku addons --app acme-inc-www
```

_See code: [src/commands/addons/index.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/index.ts)_

## `heroku addons:attach ADDON_NAME`

attach an existing add-on resource to an app

```
USAGE
  $ heroku addons:attach ADDON_NAME -a <value> [--as <value>] [--credential <value>] [--confirm <value>] [-r
    <value>]

ARGUMENTS
  ADDON_NAME  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>         (required) app to run command against
  -r, --remote=<value>      git remote of app to use
      --as=<value>          name for add-on attachment
      --confirm=<value>     overwrite existing add-on attachment with same name
      --credential=<value>  credential name for scoped access to Heroku Postgres

DESCRIPTION
  attach an existing add-on resource to an app
```

_See code: [src/commands/addons/attach.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/attach.ts)_

## `heroku addons:create SERVICE:PLAN`

Create a new add-on resource.

```
USAGE
  $ heroku addons:create SERVICE:PLAN... -a <value> [--name <value>] [--as <value>] [--confirm <value>] [--wait]
    [-r <value>]

ARGUMENTS
  SERVICE:PLAN...  unique identifier or unique name of the add-on service plan

FLAGS
  -a, --app=<value>      (required) app to run command against
  -r, --remote=<value>   git remote of app to use
      --as=<value>       name for the initial add-on attachment
      --confirm=<value>  overwrite existing config vars or existing add-on attachments
      --name=<value>     name for the add-on resource
      --wait             watch add-on creation status and exit when complete

DESCRIPTION
  Create a new add-on resource.

  In order to add additional config items, please place them at the end of the command after a double-dash (--).


EXAMPLES
  Create an add-on resource:
  $heroku addons:create heroku-redis --app my-app
  Create an add-on resource with additional config items:
  $heroku addons:create heroku-postgresql:standard-0 --app my-app -- --fork DATABASE
```

_See code: [src/commands/addons/create.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/create.ts)_

## `heroku addons:destroy ADDONNAME`

permanently destroy an add-on resource

```
USAGE
  $ heroku addons:destroy ADDONNAME... [-f] [-c <value>] [--wait] [-a <value>] [-r <value>]

ARGUMENTS
  ADDONNAME...  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>      app to run command against
  -c, --confirm=<value>
  -f, --force            allow destruction even if connected to other apps
  -r, --remote=<value>   git remote of app to use
      --wait             watch add-on destruction status and exit when complete

DESCRIPTION
  permanently destroy an add-on resource

EXAMPLES
  addons:destroy [ADDON]... [flags]
```

_See code: [src/commands/addons/destroy.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/destroy.ts)_

## `heroku addons:detach ATTACHMENT_NAME`

detach an existing add-on resource from an app

```
USAGE
  $ heroku addons:detach ATTACHMENT_NAME -a <value> [-r <value>]

ARGUMENTS
  ATTACHMENT_NAME  unique identifier of the add-on attachment

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  detach an existing add-on resource from an app
```

_See code: [src/commands/addons/detach.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/detach.ts)_

## `heroku addons:docs ADDON`

open an add-on's Dev Center documentation in your browser

```
USAGE
  $ heroku addons:docs ADDON [--show-url] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --show-url        show URL, do not open browser

DESCRIPTION
  open an add-on's Dev Center documentation in your browser
```

_See code: [src/commands/addons/docs.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/docs.ts)_

## `heroku addons:downgrade ADDON [PLAN]`

change add-on plan.

```
USAGE
  $ heroku addons:downgrade ADDON [PLAN] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on
  PLAN   unique identifier or name of the plan

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  change add-on plan.
  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.  Either one can be used to change an
  add-on plan up or down.

  https://devcenter.heroku.com/articles/managing-add-ons


ALIASES
  $ heroku addons:downgrade

EXAMPLES
  Upgrade an add-on by service name:
  $ heroku addons:upgrade heroku-redis:premium-2
  Upgrade a specific add-on:
  $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

## `heroku addons:info ADDON`

show detailed add-on resource and attachment information

```
USAGE
  $ heroku addons:info ADDON

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show detailed add-on resource and attachment information
```

_See code: [src/commands/addons/info.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/info.ts)_

## `heroku addons:open ADDON`

open an add-on's dashboard in your browser

```
USAGE
  $ heroku addons:open ADDON [--show-url] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --show-url        show URL, do not open browser

DESCRIPTION
  open an add-on's dashboard in your browser
```

_See code: [src/commands/addons/open.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/open.ts)_

## `heroku addons:plans SERVICE`

list all available plans for an add-on service

```
USAGE
  $ heroku addons:plans SERVICE [--json]

ARGUMENTS
  SERVICE  unique identifier or globally unique name of the add-on

FLAGS
  --json  output in json format

DESCRIPTION
  list all available plans for an add-on service
```

_See code: [src/commands/addons/plans.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/plans.ts)_

## `heroku addons:rename ADDON_NAME NEW_NAME`

rename an add-on

```
USAGE
  $ heroku addons:rename ADDON_NAME NEW_NAME

ARGUMENTS
  ADDON_NAME  unique identifier or globally unique name of the add-on
  NEW_NAME    new globally unique name of the add-on

DESCRIPTION
  rename an add-on
```

_See code: [src/commands/addons/rename.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/rename.ts)_

## `heroku addons:services`

list all available add-on services

```
USAGE
  $ heroku addons:services [--json]

FLAGS
  --json  output in json format

DESCRIPTION
  list all available add-on services
```

_See code: [src/commands/addons/services.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/services.ts)_

## `heroku addons:upgrade ADDON [PLAN]`

change add-on plan.

```
USAGE
  $ heroku addons:upgrade ADDON [PLAN] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on
  PLAN   unique identifier or name of the plan

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  change add-on plan.
  See available plans with `heroku addons:plans SERVICE`.

  Note that `heroku addons:upgrade` and `heroku addons:downgrade` are the same.  Either one can be used to change an
  add-on plan up or down.

  https://devcenter.heroku.com/articles/managing-add-ons


ALIASES
  $ heroku addons:downgrade

EXAMPLES
  Upgrade an add-on by service name:
  $ heroku addons:upgrade heroku-redis:premium-2
  Upgrade a specific add-on:
  $ heroku addons:upgrade swimming-briskly-123 heroku-redis:premium-2
```

_See code: [src/commands/addons/upgrade.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/upgrade.ts)_

## `heroku addons:wait [ADDON]`

show provisioning status of the add-ons on the app

```
USAGE
  $ heroku addons:wait [ADDON] [--wait-interval <value>] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  unique identifier or globally unique name of the add-on

FLAGS
  -a, --app=<value>            app to run command against
  -r, --remote=<value>         git remote of app to use
      --wait-interval=<value>  how frequently to poll in seconds

DESCRIPTION
  show provisioning status of the add-ons on the app
```

_See code: [src/commands/addons/wait.ts](https://github.com/heroku/cli/blob/v10.0.2-beta.1/packages/cli/src/commands/addons/wait.ts)_
