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
* [`heroku pg:settings:log-lock-waits [VALUE] [DATABASE]`](#heroku-pgsettingslog-lock-waits-value-database)
* [`heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE]`](#heroku-pgsettingslog-min-duration-statement-value-database)
* [`heroku pg:settings:log-statement [VALUE] [DATABASE]`](#heroku-pgsettingslog-statement-value-database)
* [`heroku pg:unfollow DATABASE`](#heroku-pgunfollow-database)
* [`heroku pg:upgrade [DATABASE]`](#heroku-pgupgrade-database)
* [`heroku pg:vacuum-stats [DATABASE]`](#heroku-pgvacuum-stats-database)
* [`heroku pg:wait [DATABASE]`](#heroku-pgwait-database)

## `heroku pg [DATABASE]`

show database information

```
USAGE
  $ heroku pg [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups`

list database backups

```
USAGE
  $ heroku pg:backups

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:cancel [BACKUP_ID]`

cancel an in-progress backup or restore (default newest)

```
USAGE
  $ heroku pg:backups:cancel [BACKUP_ID]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:capture [DATABASE]`

capture a new backup

```
USAGE
  $ heroku pg:backups:capture [DATABASE]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --wait-interval=wait-interval
```

## `heroku pg:backups:delete BACKUP_ID`

delete a backup

```
USAGE
  $ heroku pg:backups:delete BACKUP_ID

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

## `heroku pg:backups:download [BACKUP_ID]`

downloads database backup

```
USAGE
  $ heroku pg:backups:download [BACKUP_ID]

OPTIONS
  -a, --app=app        (required) app to run command against
  -o, --output=output  location to download to. Defaults to latest.dump
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:info [BACKUP_ID]`

get information about a specific backup

```
USAGE
  $ heroku pg:backups:info [BACKUP_ID]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:restore [BACKUP] [DATABASE]`

restore a backup (default latest) to a database

```
USAGE
  $ heroku pg:backups:restore [BACKUP] [DATABASE]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --wait-interval=wait-interval

DESCRIPTION
  defaults to saving the latest database to DATABASE_URL
```

## `heroku pg:backups:schedule [DATABASE]`

schedule daily backups for given database

```
USAGE
  $ heroku pg:backups:schedule [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

  --at=at              (required) at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00
                       [TIMEZONE]'
```

## `heroku pg:backups:schedules`

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:unschedule [DATABASE]`

stop daily backups

```
USAGE
  $ heroku pg:backups:unschedule [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:backups:url [BACKUP_ID]`

get secret but publicly accessible URL of a backup

```
USAGE
  $ heroku pg:backups:url [BACKUP_ID]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:bloat [DATABASE]`

show table and index bloat in your database ordered by most wasteful

```
USAGE
  $ heroku pg:bloat [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:blocking [DATABASE]`

display queries holding locks other queries are waiting to be released

```
USAGE
  $ heroku pg:blocking [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:connection-pooling:attach [DATABASE]`

add an attachment to a database using connection pooling

```
USAGE
  $ heroku pg:connection-pooling:attach [DATABASE]

OPTIONS
  -a, --app=app                (required) app to run command against
  -n, --credential=credential  name of the credential within the database
  -r, --remote=remote          git remote of app to use
  --as=as                      name for add-on attachment

DESCRIPTION
  Example:

     heroku pg:connection-pooling:attach postgresql-something-12345 --credential cred-name
```

## `heroku pg:copy SOURCE TARGET`

copy all data from source db to target

```
USAGE
  $ heroku pg:copy SOURCE TARGET

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  --confirm=confirm
  --verbose
  --wait-interval=wait-interval

DESCRIPTION
  at least one of the databases must be a Heroku PostgreSQL DB
```

## `heroku pg:credentials [DATABASE]`

show information on credentials in the database

```
USAGE
  $ heroku pg:credentials [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --reset              DEPRECATED
```

## `heroku pg:credentials:create [DATABASE]`

create credential within database

```
USAGE
  $ heroku pg:credentials:create [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      (required) name of the new credential within the database
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:create postgresql-something-12345 --name new-cred-name
```

## `heroku pg:credentials:destroy [DATABASE]`

destroy credential within database

```
USAGE
  $ heroku pg:credentials:destroy [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        (required) unique identifier for the credential
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
```

## `heroku pg:credentials:repair-default [DATABASE]`

repair the permissions of the default credential within database

```
USAGE
  $ heroku pg:credentials:repair-default [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:repair-default postgresql-something-12345
```

## `heroku pg:credentials:rotate [DATABASE]`

rotate the database credentials

```
USAGE
  $ heroku pg:credentials:rotate [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        which credential to rotate (default credentials if not specified)
  -r, --remote=remote    git remote of app to use
  --all                  rotate all credentials
  --force                forces rotating the targeted credentials
```

## `heroku pg:credentials:url [DATABASE]`

show information on a database credential

```
USAGE
  $ heroku pg:credentials:url [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      which credential to show (default credentials if not specified)
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:diagnose [DATABASE|REPORT_ID]`

run or view diagnostics report

```
USAGE
  $ heroku pg:diagnose [DATABASE|REPORT_ID]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  defaults to DATABASE_URL database if no DATABASE is specified
  if REPORT_ID is specified instead, a previous report is displayed
```

## `heroku pg:info [DATABASE]`

show database information

```
USAGE
  $ heroku pg:info [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:kill PID [DATABASE]`

kill a query

```
USAGE
  $ heroku pg:kill PID [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:killall [DATABASE]`

terminates all connections for all credentials

```
USAGE
  $ heroku pg:killall [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:links [DATABASE]`

lists all databases and information on link

```
USAGE
  $ heroku pg:links [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:links:create REMOTE DATABASE`

create a link between data stores

```
USAGE
  $ heroku pg:links:create REMOTE DATABASE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --as=as              name of link to create

DESCRIPTION
  Example:

       heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN
```

## `heroku pg:links:destroy DATABASE LINK`

destroys a link between data stores

```
USAGE
  $ heroku pg:links:destroy DATABASE LINK

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100
```

## `heroku pg:locks [DATABASE]`

display queries with active locks

```
USAGE
  $ heroku pg:locks [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -t, --truncate       truncates queries to 40 charaters
```

## `heroku pg:maintenance [DATABASE]`

show current maintenance information

```
USAGE
  $ heroku pg:maintenance [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:maintenance:run [DATABASE]`

start maintenance

```
USAGE
  $ heroku pg:maintenance:run [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:maintenance:window DATABASE WINDOW`

set weekly maintenance window

```
USAGE
  $ heroku pg:maintenance:window DATABASE WINDOW

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  All times are in UTC.

  Example:

       heroku pg:maintenance:window postgres-slippery-100 "Sunday 06:00"
```

## `heroku pg:outliers [DATABASE]`

show 10 queries that have longest execution time in aggregate

```
USAGE
  $ heroku pg:outliers [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --num=num        the number of queries to display (default: 10)
  -r, --remote=remote  git remote of app to use
  -t, --truncate       truncate queries to 40 characters
  --reset              resets statistics gathered by pg_stat_statements
```

## `heroku pg:promote DATABASE`

sets DATABASE as your DATABASE_URL

```
USAGE
  $ heroku pg:promote DATABASE

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:ps [DATABASE]`

view active queries with execution time

```
USAGE
  $ heroku pg:ps [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -v, --verbose
```

## `heroku pg:psql [DATABASE]`

open a psql shell to the database

```
USAGE
  $ heroku pg:psql [DATABASE]

OPTIONS
  -a, --app=app            (required) app to run command against
  -c, --command=command    SQL command to run
  -f, --file=file          SQL file to run
  -r, --remote=remote      git remote of app to use
  --credential=credential  credential to use
```

## `heroku pg:pull SOURCE TARGET`

pull Heroku database into local or remote database

```
USAGE
  $ heroku pg:pull SOURCE TARGET

OPTIONS
  -a, --app=app                            (required) app to run command against
  -r, --remote=remote                      git remote of app to use
  --exclude-table-data=exclude-table-data  tables for which data should be excluded (use ';' to split multiple names)

DESCRIPTION
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
  $ heroku pg:push SOURCE TARGET

OPTIONS
  -a, --app=app                            (required) app to run command against
  -r, --remote=remote                      git remote of app to use
  --exclude-table-data=exclude-table-data  tables for which data should be excluded (use ';' to split multiple names)

DESCRIPTION
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
  $ heroku pg:reset [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

## `heroku pg:settings [DATABASE]`

show your current database settings

```
USAGE
  $ heroku pg:settings [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:settings:log-lock-waits [VALUE] [DATABASE]`

Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second

```
USAGE
  $ heroku pg:settings:log-lock-waits [VALUE] [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same 
  time.
  Applications and their query patterns should try to avoid changes to many different tables within the same 
  transaction.
```

## `heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE]`

The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.

```
USAGE
  $ heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  VALUE needs to specified as a whole number, in milliseconds.
  Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement 
  durations.
```

## `heroku pg:settings:log-statement [VALUE] [DATABASE]`

log_statement controls which SQL statements are logged.

```
USAGE
  $ heroku pg:settings:log-statement [VALUE] [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Valid values for VALUE:
  none - No statements are logged
  ddl  - All data definition statements, such as CREATE, ALTER and DROP will be logged
  mod  - Includes all statements from ddl as well as data-modifying statements such as INSERT, UPDATE, DELETE, TRUNCATE, 
  COPY
  all  - All statements are logged
```

## `heroku pg:unfollow DATABASE`

stop a replica from following and make it a writeable database

```
USAGE
  $ heroku pg:unfollow DATABASE

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

## `heroku pg:upgrade [DATABASE]`

unfollow a database and upgrade it to the latest stable PostgreSQL version

```
USAGE
  $ heroku pg:upgrade [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
  -v, --version=version  PostgreSQL version to upgrade to

DESCRIPTION
  to upgrade to another PostgreSQL version, use pg:copy instead
```

## `heroku pg:vacuum-stats [DATABASE]`

show dead rows and whether an automatic vacuum is expected to be triggered

```
USAGE
  $ heroku pg:vacuum-stats [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku pg:wait [DATABASE]`

blocks until database is available

```
USAGE
  $ heroku pg:wait [DATABASE]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  --no-notify                    do not show OS notification
  --wait-interval=wait-interval  how frequently to poll in seconds (to avoid rate limiting)
```
