`heroku pg`
===========

manage postgresql databases

* [`heroku pg [DATABASE]`](#heroku-pg-database)
* [`heroku pg:backups`](#heroku-pgbackups)
* [`heroku pg:backups:cancel [BACKUP_ID]`](#heroku-pgbackupscancel-backup_id)
* [`heroku pg:backups:capture [DATABASE]`](#heroku-pgbackupscapture-database)
* [`heroku pg:backups:delete BACKUP_ID`](#heroku-pgbackupsdelete-backup_id)
* [`heroku pg:backups:download [BACKUP_ID]`](#heroku-pgbackupsdownload-backup_id)
* [`heroku pg:backups:info [BACKUP_ID]`](#heroku-pgbackupsinfo-backup_id)
* [`heroku pg:backups:restore [BACKUP] [DATABASE]`](#heroku-pgbackupsrestore-backup-database)
* [`heroku pg:backups:schedule [DATABASE]`](#heroku-pgbackupsschedule-database)
* [`heroku pg:backups:schedules`](#heroku-pgbackupsschedules)
* [`heroku pg:backups:unschedule [DATABASE]`](#heroku-pgbackupsunschedule-database)
* [`heroku pg:backups:url [BACKUP_ID]`](#heroku-pgbackupsurl-backup_id)
* [`heroku pg:bloat [DATABASE]`](#heroku-pgbloat-database)
* [`heroku pg:blocking [DATABASE]`](#heroku-pgblocking-database)
* [`heroku pg:connection-pooling:attach [DATABASE]`](#heroku-pgconnection-poolingattach-database)
* [`heroku pg:copy SOURCE TARGET`](#heroku-pgcopy-source-target)
* [`heroku pg:credentials [DATABASE]`](#heroku-pgcredentials-database)
* [`heroku pg:credentials:create [DATABASE]`](#heroku-pgcredentialscreate-database)
* [`heroku pg:credentials:destroy [DATABASE]`](#heroku-pgcredentialsdestroy-database)
* [`heroku pg:credentials:repair-default [DATABASE]`](#heroku-pgcredentialsrepair-default-database)
* [`heroku pg:credentials:rotate [DATABASE]`](#heroku-pgcredentialsrotate-database)
* [`heroku pg:credentials:url [DATABASE]`](#heroku-pgcredentialsurl-database)
* [`heroku pg:diagnose [DATABASE|REPORT_ID]`](#heroku-pgdiagnose-databasereport_id)
* [`heroku pg:info [DATABASE]`](#heroku-pginfo-database)
* [`heroku pg:kill PID [DATABASE]`](#heroku-pgkill-pid-database)
* [`heroku pg:killall [DATABASE]`](#heroku-pgkillall-database)
* [`heroku pg:links [DATABASE]`](#heroku-pglinks-database)
* [`heroku pg:links:create REMOTE DATABASE`](#heroku-pglinkscreate-remote-database)
* [`heroku pg:links:destroy DATABASE LINK`](#heroku-pglinksdestroy-database-link)
* [`heroku pg:locks [DATABASE]`](#heroku-pglocks-database)
* [`heroku pg:maintenance [DATABASE]`](#heroku-pgmaintenance-database)
* [`heroku pg:maintenance:run [DATABASE]`](#heroku-pgmaintenancerun-database)
* [`heroku pg:maintenance:window DATABASE WINDOW`](#heroku-pgmaintenancewindow-database-window)
* [`heroku pg:outliers [DATABASE]`](#heroku-pgoutliers-database)
* [`heroku pg:promote DATABASE`](#heroku-pgpromote-database)
* [`heroku pg:ps [DATABASE]`](#heroku-pgps-database)
* [`heroku pg:psql [DATABASE]`](#heroku-pgpsql-database)
* [`heroku pg:pull SOURCE TARGET`](#heroku-pgpull-source-target)
* [`heroku pg:push SOURCE TARGET`](#heroku-pgpush-source-target)
* [`heroku pg:reset [DATABASE]`](#heroku-pgreset-database)
* [`heroku pg:settings [DATABASE]`](#heroku-pgsettings-database)
* [`heroku pg:settings:auto-explain [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explain-value-database)
* [`heroku pg:settings:auto-explain:log-analyze [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-analyze-value-database)
* [`heroku pg:settings:auto-explain:log-buffers [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-buffers-value-database)
* [`heroku pg:settings:auto-explain:log-min-duration [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-min-duration-value-database)
* [`heroku pg:settings:auto-explain:log-nested-statements [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-nested-statements-value-database)
* [`heroku pg:settings:auto-explain:log-triggers [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-triggers-value-database)
* [`heroku pg:settings:auto-explain:log-verbose [VALUE] [DATABASE]`](#heroku-pgsettingsauto-explainlog-verbose-value-database)
* [`heroku pg:settings:log-lock-waits [VALUE] [DATABASE]`](#heroku-pgsettingslog-lock-waits-value-database)
* [`heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE]`](#heroku-pgsettingslog-min-duration-statement-value-database)
* [`heroku pg:settings:log-statement [VALUE] [DATABASE]`](#heroku-pgsettingslog-statement-value-database)
* [`heroku pg:settings:track-functions [VALUE] [DATABASE]`](#heroku-pgsettingstrack-functions-value-database)
* [`heroku pg:unfollow DATABASE`](#heroku-pgunfollow-database)
* [`heroku pg:upgrade [DATABASE]`](#heroku-pgupgrade-database)
* [`heroku pg:vacuum-stats [DATABASE]`](#heroku-pgvacuum-stats-database)
* [`heroku pg:wait [DATABASE]`](#heroku-pgwait-database)

## `heroku pg [DATABASE]`

show database information

```
USAGE
  $ heroku pg [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show database information
```

## `heroku pg:backups`

list database backups

```
USAGE
  $ heroku pg:backups -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  list database backups
```

## `heroku pg:backups:cancel [BACKUP_ID]`

cancel an in-progress backup or restore (default newest)

```
USAGE
  $ heroku pg:backups:cancel [BACKUP_ID] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  cancel an in-progress backup or restore (default newest)
```

## `heroku pg:backups:capture [DATABASE]`

capture a new backup

```
USAGE
  $ heroku pg:backups:capture [DATABASE] -a <value> [--wait-interval <value>] [-v] [-r <value>]

FLAGS
  -a, --app=<value>        (required) app to run command against
  -r, --remote=<value>     git remote of app to use
  -v, --verbose
  --wait-interval=<value>

DESCRIPTION
  capture a new backup
```

## `heroku pg:backups:delete BACKUP_ID`

delete a backup

```
USAGE
  $ heroku pg:backups:delete BACKUP_ID -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  delete a backup
```

## `heroku pg:backups:download [BACKUP_ID]`

downloads database backup

```
USAGE
  $ heroku pg:backups:download [BACKUP_ID] -a <value> [-o <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -o, --output=<value>  location to download to. Defaults to latest.dump
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  downloads database backup
```

## `heroku pg:backups:info [BACKUP_ID]`

get information about a specific backup

```
USAGE
  $ heroku pg:backups:info [BACKUP_ID] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  get information about a specific backup
```

## `heroku pg:backups:restore [BACKUP] [DATABASE]`

restore a backup (default latest) to a database

```
USAGE
  $ heroku pg:backups:restore [BACKUP] [DATABASE] -a <value> [--wait-interval <value>] [-e <value>] [-v] [-c <value>]
    [-r <value>]

FLAGS
  -a, --app=<value>         (required) app to run command against
  -c, --confirm=<value>
  -e, --extensions=<value>  comma-separated list of extensions to pre-install in the public schema
  -r, --remote=<value>      git remote of app to use
  -v, --verbose
  --wait-interval=<value>

DESCRIPTION
  restore a backup (default latest) to a database
  defaults to saving the latest database to DATABASE_URL
```

## `heroku pg:backups:schedule [DATABASE]`

schedule daily backups for given database

```
USAGE
  $ heroku pg:backups:schedule [DATABASE] --at <value> -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --at=<value>          (required) at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00
                        [TIMEZONE]'

DESCRIPTION
  schedule daily backups for given database
```

## `heroku pg:backups:schedules`

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  list backup schedule
```

## `heroku pg:backups:unschedule [DATABASE]`

stop daily backups

```
USAGE
  $ heroku pg:backups:unschedule [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  stop daily backups
```

## `heroku pg:backups:url [BACKUP_ID]`

get secret but publicly accessible URL of a backup

```
USAGE
  $ heroku pg:backups:url [BACKUP_ID] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  get secret but publicly accessible URL of a backup
```

## `heroku pg:bloat [DATABASE]`

show table and index bloat in your database ordered by most wasteful

```
USAGE
  $ heroku pg:bloat [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show table and index bloat in your database ordered by most wasteful
```

## `heroku pg:blocking [DATABASE]`

display queries holding locks other queries are waiting to be released

```
USAGE
  $ heroku pg:blocking [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  display queries holding locks other queries are waiting to be released
```

## `heroku pg:connection-pooling:attach [DATABASE]`

add an attachment to a database using connection pooling

```
USAGE
  $ heroku pg:connection-pooling:attach [DATABASE] -a <value> [--as <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --as=<value>          name for add-on attachment

DESCRIPTION
  add an attachment to a database using connection pooling
  Example:

  heroku pg:connection-pooling:attach postgresql-something-12345
```

## `heroku pg:copy SOURCE TARGET`

copy all data from source db to target

```
USAGE
  $ heroku pg:copy SOURCE TARGET -a <value> [--wait-interval <value>] [--verbose] [--confirm <value>] [-r
    <value>]

FLAGS
  -a, --app=<value>        (required) app to run command against
  -r, --remote=<value>     git remote of app to use
  --confirm=<value>
  --verbose
  --wait-interval=<value>

DESCRIPTION
  copy all data from source db to target
  at least one of the databases must be a Heroku PostgreSQL DB
```

## `heroku pg:credentials [DATABASE]`

show information on credentials in the database

```
USAGE
  $ heroku pg:credentials [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show information on credentials in the database
```

## `heroku pg:credentials:create [DATABASE]`

create credential within database

```
USAGE
  $ heroku pg:credentials:create [DATABASE] -n <value> -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --name=<value>    (required) name of the new credential within the database
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  create credential within database
  Example:

  heroku pg:credentials:create postgresql-something-12345 --name new-cred-name
```

## `heroku pg:credentials:destroy [DATABASE]`

destroy credential within database

```
USAGE
  $ heroku pg:credentials:destroy [DATABASE] -n <value> -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -n, --name=<value>     (required) unique identifier for the credential
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  destroy credential within database
  Example:

  heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
```

## `heroku pg:credentials:repair-default [DATABASE]`

repair the permissions of the default credential within database

```
USAGE
  $ heroku pg:credentials:repair-default [DATABASE] -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  repair the permissions of the default credential within database
  Example:

  heroku pg:credentials:repair-default postgresql-something-12345
```

## `heroku pg:credentials:rotate [DATABASE]`

rotate the database credentials

```
USAGE
  $ heroku pg:credentials:rotate [DATABASE] -a <value> [-n <value>] [--all] [-c <value>] [--force] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -n, --name=<value>     which credential to rotate (default credentials if not specified)
  -r, --remote=<value>   git remote of app to use
  --all                  rotate all credentials
  --force                forces rotating the targeted credentials

DESCRIPTION
  rotate the database credentials
```

## `heroku pg:credentials:url [DATABASE]`

show information on a database credential

```
USAGE
  $ heroku pg:credentials:url [DATABASE] -a <value> [-n <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --name=<value>    which credential to show (default credentials if not specified)
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show information on a database credential
```

## `heroku pg:diagnose [DATABASE|REPORT_ID]`

run or view diagnostics report

```
USAGE
  $ heroku pg:diagnose [DATABASE|REPORT_ID] -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                format output as JSON

DESCRIPTION
  run or view diagnostics report

  defaults to DATABASE_URL database if no DATABASE is specified
  if REPORT_ID is specified instead, a previous report is displayed
```

## `heroku pg:info [DATABASE]`

show database information

```
USAGE
  $ heroku pg:info [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show database information
```

## `heroku pg:kill PID [DATABASE]`

kill a query

```
USAGE
  $ heroku pg:kill PID [DATABASE] -a <value> [-f] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -f, --force
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  kill a query
```

## `heroku pg:killall [DATABASE]`

terminates all connections for all credentials

```
USAGE
  $ heroku pg:killall [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  terminates all connections for all credentials
```

## `heroku pg:links [DATABASE]`

lists all databases and information on link

```
USAGE
  $ heroku pg:links [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  lists all databases and information on link
```

## `heroku pg:links:create REMOTE DATABASE`

create a link between data stores

```
USAGE
  $ heroku pg:links:create REMOTE DATABASE -a <value> [--as <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --as=<value>          name of link to create

DESCRIPTION
  create a link between data stores
  Example:

  heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN
```

## `heroku pg:links:destroy DATABASE LINK`

destroys a link between data stores

```
USAGE
  $ heroku pg:links:destroy DATABASE LINK -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  destroys a link between data stores
  Example:

  heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100
```

## `heroku pg:locks [DATABASE]`

display queries with active locks

```
USAGE
  $ heroku pg:locks [DATABASE] -a <value> [-t] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -t, --truncate        truncates queries to 40 charaters

DESCRIPTION
  display queries with active locks
```

## `heroku pg:maintenance [DATABASE]`

show current maintenance information

```
USAGE
  $ heroku pg:maintenance [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show current maintenance information
```

## `heroku pg:maintenance:run [DATABASE]`

start maintenance

```
USAGE
  $ heroku pg:maintenance:run [DATABASE] -a <value> [-f] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -f, --force
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  start maintenance
```

## `heroku pg:maintenance:window DATABASE WINDOW`

set weekly maintenance window

```
USAGE
  $ heroku pg:maintenance:window DATABASE WINDOW -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set weekly maintenance window
  All times are in UTC.

  Example:

  heroku pg:maintenance:window postgres-slippery-100 "Sunday 06:00"
```

## `heroku pg:outliers [DATABASE]`

show 10 queries that have longest execution time in aggregate

```
USAGE
  $ heroku pg:outliers [DATABASE] -a <value> [--reset] [-t] [-n <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --num=<value>     the number of queries to display (default: 10)
  -r, --remote=<value>  git remote of app to use
  -t, --truncate        truncate queries to 40 characters
  --reset               resets statistics gathered by pg_stat_statements

DESCRIPTION
  show 10 queries that have longest execution time in aggregate
```

## `heroku pg:promote DATABASE`

sets DATABASE as your DATABASE_URL

```
USAGE
  $ heroku pg:promote DATABASE -a <value> [-f] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -f, --force
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  sets DATABASE as your DATABASE_URL
```

## `heroku pg:ps [DATABASE]`

view active queries with execution time

```
USAGE
  $ heroku pg:ps [DATABASE] -a <value> [-v] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -v, --verbose

DESCRIPTION
  view active queries with execution time
```

## `heroku pg:psql [DATABASE]`

open a psql shell to the database

```
USAGE
  $ heroku pg:psql [DATABASE] -a <value> [-c <value>] [-f <value>] [--credential <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --command=<value>  SQL command to run
  -f, --file=<value>     SQL file to run
  -r, --remote=<value>   git remote of app to use
  --credential=<value>   credential to use

DESCRIPTION
  open a psql shell to the database
```

## `heroku pg:pull SOURCE TARGET`

pull Heroku database into local or remote database

```
USAGE
  $ heroku pg:pull SOURCE TARGET -a <value> [--exclude-table-data <value>] [-r <value>]

FLAGS
  -a, --app=<value>             (required) app to run command against
  -r, --remote=<value>          git remote of app to use
  --exclude-table-data=<value>  tables for which data should be excluded (use ';' to split multiple names)

DESCRIPTION
  pull Heroku database into local or remote database
  Pull from SOURCE into TARGET.

  TARGET must be one of:
  * a database name (i.e. on a local PostgreSQL server)  => TARGET must not exist and will be created
  * a fully qualified URL to a local PostgreSQL server   => TARGET must not exist and will be created
  * a fully qualified URL to a remote PostgreSQL server  => TARGET must exist and be empty

  To delete a local database run `dropdb TARGET`
  To create an empty remote database, run `createdb` with connection command-line options (run `createdb --help` for
  details).

  Examples:

  # pull Heroku DB named postgresql-swimmingly-100 into local DB mylocaldb that must not exist
  $ heroku pg:pull postgresql-swimmingly-100 mylocaldb --app sushi

  # pull Heroku DB named postgresql-swimmingly-100 into empty remote DB at postgres://myhost/mydb
  $ heroku pg:pull postgresql-swimmingly-100 postgres://myhost/mydb --app sushi
```

## `heroku pg:push SOURCE TARGET`

push local or remote into Heroku database

```
USAGE
  $ heroku pg:push SOURCE TARGET -a <value> [--exclude-table-data <value>] [-r <value>]

FLAGS
  -a, --app=<value>             (required) app to run command against
  -r, --remote=<value>          git remote of app to use
  --exclude-table-data=<value>  tables for which data should be excluded (use ';' to split multiple names)

DESCRIPTION
  push local or remote into Heroku database
  Push from SOURCE into TARGET. TARGET must be empty.

  To empty a Heroku database for push run `heroku pg:reset`

  SOURCE must be either the name of a database existing on your localhost or the
  fully qualified URL of a remote database.

  Examples:

  # push mylocaldb into a Heroku DB named postgresql-swimmingly-100
  $ heroku pg:push mylocaldb postgresql-swimmingly-100

  # push remote DB at postgres://myhost/mydb into a Heroku DB named postgresql-swimmingly-100
  $ heroku pg:push postgres://myhost/mydb postgresql-swimmingly-100
```

## `heroku pg:reset [DATABASE]`

delete all data in DATABASE

```
USAGE
  $ heroku pg:reset [DATABASE] -a <value> [-e <value>] [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>         (required) app to run command against
  -c, --confirm=<value>
  -e, --extensions=<value>  comma-separated list of extensions to pre-install in the public schema
  -r, --remote=<value>      git remote of app to use

DESCRIPTION
  delete all data in DATABASE
```

## `heroku pg:settings [DATABASE]`

show your current database settings

```
USAGE
  $ heroku pg:settings [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show your current database settings
```

## `heroku pg:settings:auto-explain [VALUE] [DATABASE]`

Automatically log execution plans of queries without running EXPLAIN by hand.

```
USAGE
  $ heroku pg:settings:auto-explain [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Automatically log execution plans of queries without running EXPLAIN by hand.
  The auto_explain module is loaded at session-time so existing connections will not be logged.
  Restart your Heroku app and/or restart existing connections for logging to start taking place.
```

## `heroku pg:settings:auto-explain:log-analyze [VALUE] [DATABASE]`

Shows actual run times on the execution plan.

```
USAGE
  $ heroku pg:settings:auto-explain:log-analyze [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Shows actual run times on the execution plan.
  This is equivalent to calling EXPLAIN ANALYZE.

  WARNING: EXPLAIN ANALYZE will be run on ALL queries, not just logged queries. This can cause significant performance
  impacts to your database and should be used with caution.
```

## `heroku pg:settings:auto-explain:log-buffers [VALUE] [DATABASE]`

Includes buffer usage statistics when execution plans are logged.

```
USAGE
  $ heroku pg:settings:auto-explain:log-buffers [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Includes buffer usage statistics when execution plans are logged.
  This is equivalent to calling EXPLAIN BUFFERS and can only be used in conjunction with
  pg:settings:auto-explain:log-analyze turned on.
```

## `heroku pg:settings:auto-explain:log-min-duration [VALUE] [DATABASE]`

Sets the minimum execution time in milliseconds for a statement's plan to be logged.

```
USAGE
  $ heroku pg:settings:auto-explain:log-min-duration [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Sets the minimum execution time in milliseconds for a statement's plan to be logged.
  Setting this value to 0 will log all queries. Setting this value to -1 will disable logging entirely.

  WARNING: Setting a low value may have performance impacts on your database as well as generate a large volume of logs.
```

## `heroku pg:settings:auto-explain:log-nested-statements [VALUE] [DATABASE]`

Nested statements are included in the execution plan's log.

```
USAGE
  $ heroku pg:settings:auto-explain:log-nested-statements [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Nested statements are included in the execution plan's log.
```

## `heroku pg:settings:auto-explain:log-triggers [VALUE] [DATABASE]`

Includes trigger execution statistics in execution plan logs.

```
USAGE
  $ heroku pg:settings:auto-explain:log-triggers [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Includes trigger execution statistics in execution plan logs.
  This parameter can only be used in conjunction with pg:settings:auto-explain:log-analyze turned on.
```

## `heroku pg:settings:auto-explain:log-verbose [VALUE] [DATABASE]`

Include verbose details in execution plans.

```
USAGE
  $ heroku pg:settings:auto-explain:log-verbose [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Include verbose details in execution plans.
  This is equivalent to calling EXPLAIN VERBOSE.
```

## `heroku pg:settings:log-lock-waits [VALUE] [DATABASE]`

Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second

```
USAGE
  $ heroku pg:settings:log-lock-waits [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock.
  deadlock_timeout is set to 1 second
  Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same
  time.
  Applications and their query patterns should try to avoid changes to many different tables within the same
  transaction.
```

## `heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE]`

The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.

```
USAGE
  $ heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.
  VALUE needs to specified as a whole number, in milliseconds.
  Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement
  durations.
```

## `heroku pg:settings:log-statement [VALUE] [DATABASE]`

log_statement controls which SQL statements are logged.

```
USAGE
  $ heroku pg:settings:log-statement [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  log_statement controls which SQL statements are logged.
  Valid values for VALUE:
  none - No statements are logged
  ddl  - All data definition statements, such as CREATE, ALTER and DROP will be logged
  mod  - Includes all statements from ddl as well as data-modifying statements such as INSERT, UPDATE, DELETE, TRUNCATE,
  COPY
  all  - All statements are logged
```

## `heroku pg:settings:track-functions [VALUE] [DATABASE]`

track_functions controls tracking of function call counts and time used. Default is none.

```
USAGE
  $ heroku pg:settings:track-functions [VALUE] [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  track_functions controls tracking of function call counts and time used. Default is none.
  Valid values for VALUE:
  none - No functions are tracked
  pl   - Only procedural language functions are tracked
  all  - All functions, including SQL and C language functions, are tracked. Simple SQL-language that are inlined are
  not tracked
```

## `heroku pg:unfollow DATABASE`

stop a replica from following and make it a writeable database

```
USAGE
  $ heroku pg:unfollow DATABASE -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  stop a replica from following and make it a writeable database
```

## `heroku pg:upgrade [DATABASE]`

unfollow a database and upgrade it to the latest stable PostgreSQL version

```
USAGE
  $ heroku pg:upgrade [DATABASE] -a <value> [-c <value>] [-v <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use
  -v, --version=<value>  PostgreSQL version to upgrade to

DESCRIPTION
  unfollow a database and upgrade it to the latest stable PostgreSQL version
  to upgrade to another PostgreSQL version, use pg:copy instead
```

## `heroku pg:vacuum-stats [DATABASE]`

show dead rows and whether an automatic vacuum is expected to be triggered

```
USAGE
  $ heroku pg:vacuum-stats [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  show dead rows and whether an automatic vacuum is expected to be triggered
```

## `heroku pg:wait [DATABASE]`

blocks until database is available

```
USAGE
  $ heroku pg:wait [DATABASE] -a <value> [--wait-interval <value>] [--no-notify] [-r <value>]

FLAGS
  -a, --app=<value>        (required) app to run command against
  -r, --remote=<value>     git remote of app to use
  --no-notify              do not show OS notification
  --wait-interval=<value>  how frequently to poll in seconds (to avoid rate limiting)

DESCRIPTION
  blocks until database is available
```
