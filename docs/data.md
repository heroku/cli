`heroku data`
=============

list maintenances for an app's data addons

* [`heroku data:maintenances`](#heroku-datamaintenances)
* [`heroku data:maintenances:history ADDON`](#heroku-datamaintenanceshistory-addon)
* [`heroku data:maintenances:info ADDON`](#heroku-datamaintenancesinfo-addon)
* [`heroku data:maintenances:run ADDON`](#heroku-datamaintenancesrun-addon)
* [`heroku data:maintenances:schedule ADDON`](#heroku-datamaintenancesschedule-addon)
* [`heroku data:maintenances:wait ADDON`](#heroku-datamaintenanceswait-addon)
* [`heroku data:maintenances:window ADDON`](#heroku-datamaintenanceswindow-addon)
* [`heroku data:maintenances:window:update ADDON DAY_OF_WEEK TIME_OF_DAY`](#heroku-datamaintenanceswindowupdate-addon-day_of_week-time_of_day)
* [`heroku data:pg:attachments DATABASE`](#heroku-datapgattachments-database)
* [`heroku data:pg:attachments:create DATABASE`](#heroku-datapgattachmentscreate-database)
* [`heroku data:pg:attachments:destroy ATTACHMENT_NAME`](#heroku-datapgattachmentsdestroy-attachment_name)
* [`heroku data:pg:create`](#heroku-datapgcreate)
* [`heroku data:pg:credentials DATABASE`](#heroku-datapgcredentials-database)
* [`heroku data:pg:credentials:create DATABASE`](#heroku-datapgcredentialscreate-database)
* [`heroku data:pg:credentials:destroy DATABASE`](#heroku-datapgcredentialsdestroy-database)
* [`heroku data:pg:credentials:rotate DATABASE`](#heroku-datapgcredentialsrotate-database)
* [`heroku data:pg:credentials:url DATABASE`](#heroku-datapgcredentialsurl-database)
* [`heroku data:pg:destroy DATABASE`](#heroku-datapgdestroy-database)
* [`heroku data:pg:docs`](#heroku-datapgdocs)
* [`heroku data:pg:fork DATABASE`](#heroku-datapgfork-database)
* [`heroku data:pg:info DATABASE`](#heroku-datapginfo-database)
* [`heroku data:pg:levels`](#heroku-datapglevels)
* [`heroku data:pg:psql DATABASE`](#heroku-datapgpsql-database)
* [`heroku data:pg:quotas DATABASE`](#heroku-datapgquotas-database)
* [`heroku data:pg:quotas:update DATABASE`](#heroku-datapgquotasupdate-database)
* [`heroku data:pg:settings DATABASE`](#heroku-datapgsettings-database)
* [`heroku data:pg:update [DATABASE]`](#heroku-datapgupdate-database)
* [`heroku data:pg:wait DATABASE`](#heroku-datapgwait-database)

## `heroku data:maintenances`

list maintenances for an app's data addons

```
USAGE
  $ heroku data:maintenances -a <value> [--prompt] [--columns <value>] [-c] [-x] [--filter <value>] [-j] [-r <value>]
    [--sort <value>]

FLAGS
  -a, --app=<value>      (required) app to list addon maintenances for
  -c, --csv              output in csv format
  -j, --json             output result in json
  -r, --remote=<value>   git remote of app to use
  -x, --extended         show extra columns
      --columns=<value>  only show provided columns (comma-separated)
      --filter=<value>   filter property by partial string matching, ex: name=foo
      --sort=<value>     sort by property

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list maintenances for an app's data addons

EXAMPLES
  $ heroku data:maintenances --app production-app

  $ heroku data:maintenances --app production-app --json
```

_See code: [src/commands/data/maintenances/index.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/index.ts)_

## `heroku data:maintenances:history ADDON`

show details of the most recent maintenances for an addon

```
USAGE
  $ heroku data:maintenances:history ADDON [--prompt] [-a <value>] [--columns <value>] [-c] [--filter <value>] [-j] [-n
    <value>] [-r <value>] [--sort <value>]

ARGUMENTS
  ADDON  data addon

FLAGS
  -a, --app=<value>      app to run command against
  -c, --csv              output in csv format
  -j, --json             show result formatted in json
  -n, --num=<value>      [default: 5] number of maintenances to show (maximum is 20)
  -r, --remote=<value>   git remote of app to use
      --columns=<value>  only show provided columns (comma-separated)
      --filter=<value>   filter property by partial string matching, ex: name=foo
      --sort=<value>     sort by property

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  show details of the most recent maintenances for an addon

EXAMPLES
  $ heroku data:maintenances:history postgresql-sinuous-92834

  $ heroku data:maintenances:history postgresql-sinuous-92834 --num 10

  $ heroku data:maintenances:history postgresql-sinuous-92834 --json

  $ heroku data:maintenances:history DATABASE --app production-app
```

_See code: [src/commands/data/maintenances/history.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/history.ts)_

## `heroku data:maintenances:info ADDON`

display details of the most recent maintenance for an addon

```
USAGE
  $ heroku data:maintenances:info ADDON [--prompt] [-a <value>] [-j] [-r <value>]

ARGUMENTS
  ADDON  data addon to show maintenance for

FLAGS
  -a, --app=<value>     app to list addon maintenances for
  -j, --json            output result in json
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display details of the most recent maintenance for an addon

EXAMPLES
  $ heroku data:maintenances:info postgresql-sinuous-83720

  $ heroku data:maintenances:info postgresql-sinuous-83720 --json

  $ heroku data:maintenances:info DATABASE --app test-app
```

_See code: [src/commands/data/maintenances/info.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/info.ts)_

## `heroku data:maintenances:run ADDON`

triggers a scheduled maintenance for a data add-on

```
USAGE
  $ heroku data:maintenances:run ADDON [--prompt] [-a <value>] [-c <value>] [-r <value>] [-w]

ARGUMENTS
  ADDON  data addon to run maintenance on

FLAGS
  -a, --app=<value>      app to run addon maintenance for
  -c, --confirm=<value>  confirms running maintenance without entering application maintenance mode if the app name
                         matches
  -r, --remote=<value>   git remote of app to use
  -w, --wait             wait for maintenance to complete before exiting

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  triggers a scheduled maintenance for a data add-on

EXAMPLES
  $ heroku data:maintenances:run postgresql-sinuous-92834

  $ heroku data:maintenances:run postgresql-sinuous-92834 --confirm production-app

  $ heroku data:maintenances:run postgresql-sinuous-92834 --wait

  $ heroku data:maintenances:run DATABASE --app production-app
```

_See code: [src/commands/data/maintenances/run.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/run.ts)_

## `heroku data:maintenances:schedule ADDON`

schedule or re-schedule maintenance for an add-on

```
USAGE
  $ heroku data:maintenances:schedule ADDON [--prompt] [-a <value>] [-r <value>] [--week <value> | --weeks <value>]

ARGUMENTS
  ADDON  addon to schedule or re-schedule maintenance for

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
      --week=<value>    desired week to run maintenance in
      --weeks=<value>   [default: 2] the number of weeks to delay maintenance for

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  schedule or re-schedule maintenance for an add-on

EXAMPLES
  $ heroku data:maintenances:schedule postgresql-sinuous-83910

  $ heroku data:maintenances:schedule postgresql-sinuous-83910 --weeks 3

  $ heroku data:maintenances:schedule postgresql-sinuous-83910 --weeks -2

  $ heroku data:maintenances:schedule postgresql-sinuous-83910 --week 2020-02-23

  $ heroku data:maintenances:schedule HEROKU_POSTGRESQL_RED --app test-app
```

_See code: [src/commands/data/maintenances/schedule.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/schedule.ts)_

## `heroku data:maintenances:wait ADDON`

blocks until the maintenance process has completed

```
USAGE
  $ heroku data:maintenances:wait ADDON [--prompt] [-a <value>] [-r <value>]

ARGUMENTS
  ADDON  data addon

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  blocks until the maintenance process has completed

EXAMPLES
  $ heroku data:maintenances:wait postgresql-sinuous-83720

  $ heroku data:maintenances:wait DATABASE --app production-app
```

_See code: [src/commands/data/maintenances/wait.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/wait.ts)_

## `heroku data:maintenances:window ADDON`

describe the maintenance window on an add-on

```
USAGE
  $ heroku data:maintenances:window ADDON [--prompt] [-a <value>] [-j] [-r <value>]

ARGUMENTS
  ADDON  addon to show window for

FLAGS
  -a, --app=<value>     app to show addon maintenance window for
  -j, --json            output result in json
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  describe the maintenance window on an add-on

EXAMPLES
  $ heroku data:maintenances:window postgresql-sinuous-92834

  $ heroku data:maintenances:window DATABASE --app production-app
```

_See code: [src/commands/data/maintenances/window/index.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/window/index.ts)_

## `heroku data:maintenances:window:update ADDON DAY_OF_WEEK TIME_OF_DAY`

update maintenance window on an add-on

```
USAGE
  $ heroku data:maintenances:window:update ADDON DAY_OF_WEEK TIME_OF_DAY [--prompt] [-a <value>] [-j] [-r <value>]

ARGUMENTS
  ADDON        addon to change window for
  DAY_OF_WEEK  UTC maintenance window day of the week
  TIME_OF_DAY  UTC maintenance window time of day

FLAGS
  -a, --app=<value>     app to update addon maintenance window for
  -j, --json            output result in json
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  update maintenance window on an add-on

EXAMPLES
  $ heroku data:maintenances:window postgresql-sinuous-92834 sunday 13:30

  $ heroku data:maintenances:window postgresql-sinuous-92834 sunday 1:30PM

  $ heroku data:maintenances:window DATABASE sunday 1:30PM --app production-app
```

_See code: [src/commands/data/maintenances/window/update.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/maintenances/window/update.ts)_

## `heroku data:pg:attachments DATABASE`

list attachments on a Postgres Advanced database

```
USAGE
  $ heroku data:pg:attachments DATABASE -a <value> [--prompt] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list attachments on a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:attachments database_name -a example-app
```

_See code: [src/commands/data/pg/attachments/index.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/attachments/index.ts)_

## `heroku data:pg:attachments:create DATABASE`

attach an existing Postgres Advanced database to an app

```
USAGE
  $ heroku data:pg:attachments:create DATABASE -a <value> [--prompt] [--as <value>] [-c <value>] [--credential <value> | --pool
    <value>] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>         (required) app to run command against
  -c, --confirm=<value>     pass in the app name to skip confirmation prompts
  -r, --remote=<value>      git remote of app to use
      --as=<value>          name for Postgres database attachment
      --credential=<value>  credential to use for database
      --pool=<value>        instance pool to attach

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  attach an existing Postgres Advanced database to an app
```

_See code: [src/commands/data/pg/attachments/create.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/attachments/create.ts)_

## `heroku data:pg:attachments:destroy ATTACHMENT_NAME`

detach an existing database attachment from an app

```
USAGE
  $ heroku data:pg:attachments:destroy ATTACHMENT_NAME -a <value> [--prompt] [-c <value>] [-r <value>]

ARGUMENTS
  ATTACHMENT_NAME  unique identifier of the database attachment

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>  pass in the app name to skip confirmation prompts
  -r, --remote=<value>   git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  detach an existing database attachment from an app
```

_See code: [src/commands/data/pg/attachments/destroy.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/attachments/destroy.ts)_

## `heroku data:pg:create`

create a Postgres Advanced database

```
USAGE
  $ heroku data:pg:create -a <value> [--as <value>] [-c <value>] [--followers <value> --level <value>]
    [--high-availability ] [--name <value>] [--network private|shield] [--provision-option <value>...] [-r <value>]
    [--version <value>] [--wait ]

FLAGS
  -a, --app=<value>                  (required) app to run command against
  -c, --confirm=<value>              pass in the app name to skip confirmation prompts
  -r, --remote=<value>               git remote of app to use
      --as=<value>                   name for the initial database attachment
      --followers=<value>            provision a follower instance pool with the specified number of instances
      --[no-]high-availability       enable or disable high availability on the leader pool by provisioning a warm
                                     standby instance
      --level=<value>                set compute scale
      --name=<value>                 name for the database
      --network=<option>             set network for the database
                                     <options: private|shield>
      --provision-option=<value>...  additional options for provisioning in KEY:VALUE or KEY format, and VALUE defaults
                                     to "true" (example: 'foo:bar' or 'foo')
      --version=<value>              Postgres version for the database
      --wait                         watch database creation status and exit when complete

DESCRIPTION
  create a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:create --level 4G-Performance -a example-app
```

_See code: [src/commands/data/pg/create.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/create.ts)_

## `heroku data:pg:credentials DATABASE`

list credentials on a Postgres Advanced database

```
USAGE
  $ heroku data:pg:credentials DATABASE -a <value> [--prompt] [--no-wrap] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --no-wrap         disable wrapped table cells for easier copy/paste

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  list credentials on a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:credentials database_name -a example-app
```

_See code: [src/commands/data/pg/credentials/index.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/credentials/index.ts)_

## `heroku data:pg:credentials:create DATABASE`

create credentials for a Postgres database

```
USAGE
  $ heroku data:pg:credentials:create DATABASE -a <value> -n <value> [--prompt] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --name=<value>    (required) name for the credential
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  create credentials for a Postgres database

EXAMPLES
  $ heroku data:pg:credentials:create DATABASE --name my-credential --app example-app
```

_See code: [src/commands/data/pg/credentials/create.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/credentials/create.ts)_

## `heroku data:pg:credentials:destroy DATABASE`

destroy credentials on a Postgres database

```
USAGE
  $ heroku data:pg:credentials:destroy DATABASE -a <value> -n <value> [--prompt] [-c <value>] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>  pass in the app name to skip confirmation prompts
  -n, --name=<value>     (required) name of credential
  -r, --remote=<value>   git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  destroy credentials on a Postgres database

EXAMPLES
  $ heroku data:pg:credentials:destroy DATABASE --name my-credential --app example-app
```

_See code: [src/commands/data/pg/credentials/destroy.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/credentials/destroy.ts)_

## `heroku data:pg:credentials:rotate DATABASE`

rotate credentials on a Postgres database

```
USAGE
  $ heroku data:pg:credentials:rotate DATABASE -a <value> [--prompt] [--all | -n <value>] [-c <value>] [--force] [-r
  <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>  pass in the app name to skip confirmation prompts
  -n, --name=<value>     [default: owner or default credential, if not specified and --all isn't used] credential to
                         rotate
  -r, --remote=<value>   git remote of app to use
      --all              rotate all credentials
      --force            force rotate the targeted credentials

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  rotate credentials on a Postgres database
```

_See code: [src/commands/data/pg/credentials/rotate.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/credentials/rotate.ts)_

## `heroku data:pg:credentials:url DATABASE`

show information on a Postgres database credential

```
USAGE
  $ heroku data:pg:credentials:url DATABASE -a <value> [--prompt] [-n <value>] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --name=<value>    [default: owner or default credential, if not specified] credential to show
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  show information on a Postgres database credential

EXAMPLES
  $ heroku data:pg:credentials:url DATABASE --app myapp
```

_See code: [src/commands/data/pg/credentials/url.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/credentials/url.ts)_

## `heroku data:pg:destroy DATABASE`

destroy a Postgres Advanced database

```
USAGE
  $ heroku data:pg:destroy DATABASE [--prompt] [-a <value>] [-c <value>] [-f] [-r <value>]

ARGUMENTS
  DATABASE  database name, attachment name, or related config var on an app

FLAGS
  -a, --app=<value>      app to run command against
  -c, --confirm=<value>  pass in the app name to skip confirmation prompts
  -f, --force            destroy even if connected to other apps
  -r, --remote=<value>   git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  destroy a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:destroy database_name
```

_See code: [src/commands/data/pg/destroy.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/destroy.ts)_

## `heroku data:pg:docs`

open documentation for Heroku Postgres in your web browser

```
USAGE
  $ heroku data:pg:docs [--prompt] [--browser <value>]

FLAGS
  --browser=<value>  browser to open docs with (example: "firefox", "safari")

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  open documentation for Heroku Postgres in your web browser
```

_See code: [src/commands/data/pg/docs.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/docs.ts)_

## `heroku data:pg:fork DATABASE`

fork or rollback a Postgres Advanced database

```
USAGE
  $ heroku data:pg:fork DATABASE -a <value> [--prompt] [--as <value>] [-c <value>] [--level <value>] [-n <value>]
    [--provision-option <value>...] [-r <value>] [--rollback-to <value> | --rollback-by <value>] [--wait]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>                  (required) app to run command against
  -c, --confirm=<value>              pass in the app name to skip confirmation prompts
  -n, --name=<value>                 name for the database
  -r, --remote=<value>               git remote of app to use
      --as=<value>                   name for the initial database attachment
      --level=<value>                set compute scale
      --provision-option=<value>...  additional options for provisioning in KEY:VALUE or KEY format, and VALUE defaults
                                     to "true" (example: 'foo:bar' or 'foo')
      --rollback-by=<value>          time interval to rollback (example: '3 days', '2 hours', '3 days 7 hours 22
                                     minutes')
      --rollback-to=<value>          explicit timestamp for rollback database with the format '2025-11-17T15:20:00'
      --wait                         watch database fork creation status and exit when complete

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  fork or rollback a Postgres Advanced database

EXAMPLES
  # Create a fork for an existing database

    $ heroku data:pg:fork DATABASE --app my-app --as DATABASE_COPY

  # Create a point-in-time recovery fork with a timestamp:

    $ heroku data:pg:fork DATABASE --app my-app --as RESTORED --rollback-to '2025-08-11T12:35:00'

  # Create a point-in-time recovery fork with a time interval:

    $ heroku data:pg:fork DATABASE --app my-app --as RESTORED --rollback-by '1 day 3 hours 20 minutes'
```

_See code: [src/commands/data/pg/fork.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/fork.ts)_

## `heroku data:pg:info DATABASE`

get details on a Postgres Advanced database

```
USAGE
  $ heroku data:pg:info DATABASE -a <value> [--prompt] [-r <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  get details on a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:info database_name
```

_See code: [src/commands/data/pg/info.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/info.ts)_

## `heroku data:pg:levels`

show available levels for Heroku Postgres Advanced databases

```
USAGE
  $ heroku data:pg:levels

DESCRIPTION
  show available levels for Heroku Postgres Advanced databases
```

_See code: [src/commands/data/pg/levels.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/levels.ts)_

## `heroku data:pg:psql DATABASE`

open a psql shell to the database

```
USAGE
  $ heroku data:pg:psql DATABASE -a <value> [--prompt] [-c <value>] [--credential <value>] [-f <value>] [-r
    <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>         (required) app to run command against
  -c, --command=<value>     SQL command to run
  -f, --file=<value>        SQL file to run
  -r, --remote=<value>      git remote of app to use
      --credential=<value>  credential to use

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  open a psql shell to the database

EXAMPLES
  $ heroku data:pg:psql database_name -a example-app
```

_See code: [src/commands/data/pg/psql.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/psql.ts)_

## `heroku data:pg:quotas DATABASE`

display quotas set on a Postgres Advanced database

```
USAGE
  $ heroku data:pg:quotas DATABASE -a <value> [--prompt] [-r <value>] [--type storage]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --type=<option>   type of quota
                        <options: storage>

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  display quotas set on a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:quotas database_name --app example-app
```

_See code: [src/commands/data/pg/quotas/index.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/quotas/index.ts)_

## `heroku data:pg:quotas:update DATABASE`

update quota settings on a Postgres Advanced database

```
USAGE
  $ heroku data:pg:quotas:update DATABASE -a <value> --type storage [--prompt] [--critical <value>] [--enforcement-action
    notify|restrict|none] [-r <value>] [--warning <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>                  (required) app to run command against
  -r, --remote=<value>               git remote of app to use
      --critical=<value>             set critical threshold in GB, set to "none" to remove threshold
      --enforcement-action=<option>  set enforcement action for when database surpasses the critical threshold
                                     <options: notify|restrict|none>
      --type=<option>                (required) type of quota to update
                                     <options: storage>
      --warning=<value>              set warning threshold in GB, set to "none" to remove threshold

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  update quota settings on a Postgres Advanced database

EXAMPLES
  $ heroku data:pg:quotas:update --app example-app --type storage --warning 12 --critical 15 --enforcement-action notify
```

_See code: [src/commands/data/pg/quotas/update.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/quotas/update.ts)_

## `heroku data:pg:settings DATABASE`

get or update the settings of a Postgres Advanced database

```
USAGE
  $ heroku data:pg:settings DATABASE -a <value> [--prompt] [-r <value>] [--set <value>...]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --set=<value>...  Postgres setting to change in SETTING_NAME:VALUE format (example: 'track_functions:pl' or
                        'log_lock_waits:1')

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  get or update the settings of a Postgres Advanced database

EXAMPLES
  # Get database settings

    $ heroku data:pg:settings database_name -a app_name

  # Change ‘log_min_duration_statement’ and ‘log_statement’ settings for database

    $ heroku data:pg:settings database_name --set=log_min_duration_statement:2000 --set=log_statement:ddl -a \
      app_name
```

_See code: [src/commands/data/pg/settings.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/settings.ts)_

## `heroku data:pg:update [DATABASE]`

update a Postgres Advanced database through interactive prompts

```
USAGE
  $ heroku data:pg:update [DATABASE] -a <value> [-r <value>]

ARGUMENTS
  [DATABASE]  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  update a Postgres Advanced database through interactive prompts
```

_See code: [src/commands/data/pg/update.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/update.ts)_

## `heroku data:pg:wait DATABASE`

show status of an operation until it's complete

```
USAGE
  $ heroku data:pg:wait DATABASE -a <value> [--prompt] [--no-notify] [-r <value>] [--wait-interval <value>]

ARGUMENTS
  DATABASE  database name, database attachment name, or related config var on an app

FLAGS
  -a, --app=<value>            (required) app to run command against
  -r, --remote=<value>         git remote of app to use
      --no-notify              do not show OS notification
      --wait-interval=<value>  [default: 5] how frequently to poll in seconds (to avoid rate limiting)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  show status of an operation until it's complete

EXAMPLES
  # Wait for database to be available
   $ heroku data:pg:wait DATABASE --app myapp
```

_See code: [src/commands/data/pg/wait.ts](https://github.com/heroku/cli/blob/v11.2.0-beta.1/src/commands/data/pg/wait.ts)_
