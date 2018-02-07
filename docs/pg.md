heroku pg
=========

manage postgresql databases
# Commands

* [heroku pg [DATABASE] [OPTIONS]](#pg)
* [heroku pg:backups [OPTIONS]](#pgbackups)
* [heroku pg:backups:cancel [BACKUP_ID] [OPTIONS]](#pgbackupscancel)
* [heroku pg:backups:capture [DATABASE] [OPTIONS]](#pgbackupscapture)
* [heroku pg:backups:delete BACKUP_ID [OPTIONS]](#pgbackupsdelete)
* [heroku pg:backups:download [BACKUP_ID] [OPTIONS]](#pgbackupsdownload)
* [heroku pg:backups:info [BACKUP_ID] [OPTIONS]](#pgbackupsinfo)
* [heroku pg:backups:restore [BACKUP] [DATABASE] [OPTIONS]](#pgbackupsrestore)
* [heroku pg:backups:schedule [DATABASE] [OPTIONS]](#pgbackupsschedule)
* [heroku pg:backups:schedules [OPTIONS]](#pgbackupsschedules)
* [heroku pg:backups:unschedule [DATABASE] [OPTIONS]](#pgbackupsunschedule)
* [heroku pg:backups:url [BACKUP_ID] [OPTIONS]](#pgbackupsurl)
* [heroku pg:connection-pooling:attach [DATABASE] [OPTIONS]](#pgconnection-poolingattach)
* [heroku pg:copy SOURCE TARGET [OPTIONS]](#pgcopy)
* [heroku pg:credentials [DATABASE] [OPTIONS]](#pgcredentials)
* [heroku pg:credentials:create [DATABASE] [OPTIONS]](#pgcredentialscreate)
* [heroku pg:credentials:destroy [DATABASE] [OPTIONS]](#pgcredentialsdestroy)
* [heroku pg:credentials:repair-default [DATABASE] [OPTIONS]](#pgcredentialsrepair-default)
* [heroku pg:credentials:rotate [DATABASE] [OPTIONS]](#pgcredentialsrotate)
* [heroku pg:credentials:url [DATABASE] [OPTIONS]](#pgcredentialsurl)
* [heroku pg:diagnose [DATABASE|REPORT_ID] [OPTIONS]](#pgdiagnose)
* [heroku pg:info [DATABASE] [OPTIONS]](#pginfo)
* [heroku pg:kill PID [DATABASE] [OPTIONS]](#pgkill)
* [heroku pg:killall [DATABASE] [OPTIONS]](#pgkillall)
* [heroku pg:links [DATABASE] [OPTIONS]](#pglinks)
* [heroku pg:links:create REMOTE DATABASE [OPTIONS]](#pglinkscreate)
* [heroku pg:links:destroy DATABASE LINK [OPTIONS]](#pglinksdestroy)
* [heroku pg:maintenance [DATABASE] [OPTIONS]](#pgmaintenance)
* [heroku pg:maintenance:run [DATABASE] [OPTIONS]](#pgmaintenancerun)
* [heroku pg:maintenance:window DATABASE WINDOW [OPTIONS]](#pgmaintenancewindow)
* [heroku pg:outliers [DATABASE] [OPTIONS]](#pgoutliers)
* [heroku pg:promote DATABASE [OPTIONS]](#pgpromote)
* [heroku pg:ps [DATABASE] [OPTIONS]](#pgps)
* [heroku pg:psql [DATABASE] [OPTIONS]](#pgpsql)
* [heroku pg:pull SOURCE TARGET [OPTIONS]](#pgpull)
* [heroku pg:push SOURCE TARGET [OPTIONS]](#pgpush)
* [heroku pg:reset [DATABASE] [OPTIONS]](#pgreset)
* [heroku pg:settings [DATABASE] [OPTIONS]](#pgsettings)
* [heroku pg:settings:log-lock-waits [VALUE] [DATABASE] [OPTIONS]](#pgsettingslog-lock-waits)
* [heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE] [OPTIONS]](#pgsettingslog-min-duration-statement)
* [heroku pg:settings:log-statement [VALUE] [DATABASE] [OPTIONS]](#pgsettingslog-statement)
* [heroku pg:unfollow DATABASE [OPTIONS]](#pgunfollow)
* [heroku pg:upgrade [DATABASE] [OPTIONS]](#pgupgrade)
* [heroku pg:wait [DATABASE] [OPTIONS]](#pgwait)
## pg

show database information

```
USAGE
  $ heroku pg [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups

list database backups

```
USAGE
  $ heroku pg:backups [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:cancel

cancel an in-progress backup or restore (default newest)

```
USAGE
  $ heroku pg:backups:cancel [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:capture

capture a new backup

```
USAGE
  $ heroku pg:backups:capture [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --snapshot
  --wait-interval=wait-interval
```

#### pg:backups:delete

delete a backup

```
USAGE
  $ heroku pg:backups:delete BACKUP_ID [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

#### pg:backups:download

downloads database backup

```
USAGE
  $ heroku pg:backups:download [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -o, --output=output  location to download to. Defaults to latest.dump
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:info

get information about a specific backup

```
USAGE
  $ heroku pg:backups:info [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:restore

restore a backup (default latest) to a database

```
USAGE
  $ heroku pg:backups:restore [BACKUP] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --wait-interval=wait-interval

DESCRIPTION
  defaults to saving the latest database to DATABASE_URL
```

#### pg:backups:schedule

schedule daily backups for given database

```
USAGE
  $ heroku pg:backups:schedule [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

  --at=at              (required) at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00
                       [TIMEZONE]'
```

##### pg:backups:schedules

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:schedules

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:unschedule

stop daily backups

```
USAGE
  $ heroku pg:backups:unschedule [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:backups:url

get secret but publicly accessible URL of a backup

```
USAGE
  $ heroku pg:backups:url [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:cancel

cancel an in-progress backup or restore (default newest)

```
USAGE
  $ heroku pg:backups:cancel [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:capture

capture a new backup

```
USAGE
  $ heroku pg:backups:capture [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --snapshot
  --wait-interval=wait-interval
```

### pg:backups:delete

delete a backup

```
USAGE
  $ heroku pg:backups:delete BACKUP_ID [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

### pg:backups:download

downloads database backup

```
USAGE
  $ heroku pg:backups:download [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -o, --output=output  location to download to. Defaults to latest.dump
  -r, --remote=remote  git remote of app to use
```

### pg:backups:info

get information about a specific backup

```
USAGE
  $ heroku pg:backups:info [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:restore

restore a backup (default latest) to a database

```
USAGE
  $ heroku pg:backups:restore [BACKUP] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote            git remote of app to use
  -v, --verbose
  --wait-interval=wait-interval

DESCRIPTION
  defaults to saving the latest database to DATABASE_URL
```

### pg:backups:schedule

schedule daily backups for given database

```
USAGE
  $ heroku pg:backups:schedule [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

  --at=at              (required) at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00
                       [TIMEZONE]'
```

#### pg:backups:schedules

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:schedules

list backup schedule

```
USAGE
  $ heroku pg:backups:schedules [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:unschedule

stop daily backups

```
USAGE
  $ heroku pg:backups:unschedule [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:backups:url

get secret but publicly accessible URL of a backup

```
USAGE
  $ heroku pg:backups:url [BACKUP_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:connection-pooling:attach

add an attachment to a database using connection pooling

```
USAGE
  $ heroku pg:connection-pooling:attach [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                (required) app to run command against
  -n, --credential=credential  name of the credential within the database
  -r, --remote=remote          git remote of app to use
  --as=as                      name for add-on attachment

DESCRIPTION
  Example:

     heroku pg:connection-pooling:attach postgresql-something-12345 --credential cred-name
```

### pg:copy

copy all data from source db to target

```
USAGE
  $ heroku pg:copy SOURCE TARGET [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  --confirm=confirm
  --verbose
  --wait-interval=wait-interval

DESCRIPTION
  at least one of the databases must be a Heroku PostgreSQL DB
```

### pg:credentials

show information on credentials in the database

```
USAGE
  $ heroku pg:credentials [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --reset              DEPRECATED
```

#### pg:credentials:create

create credential within database

```
USAGE
  $ heroku pg:credentials:create [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      (required) name of the new credential within the database
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:create postgresql-something-12345 --name new-cred-name
```

#### pg:credentials:destroy

destroy credential within database

```
USAGE
  $ heroku pg:credentials:destroy [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        (required) unique identifier for the credential
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
```

#### pg:credentials:repair-default

repair the permissions of the default credential within database

```
USAGE
  $ heroku pg:credentials:repair-default [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:repair-default postgresql-something-12345
```

#### pg:credentials:rotate

rotate the database credentials

```
USAGE
  $ heroku pg:credentials:rotate [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        which credential to rotate (default credentials if not specified)
  -r, --remote=remote    git remote of app to use
  --all                  rotate all credentials
  --force                forces rotating the targeted credentials
```

#### pg:credentials:url

show information on a database credential

```
USAGE
  $ heroku pg:credentials:url [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      which credential to show (default credentials if not specified)
  -r, --remote=remote  git remote of app to use
```

### pg:credentials:create

create credential within database

```
USAGE
  $ heroku pg:credentials:create [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      (required) name of the new credential within the database
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:create postgresql-something-12345 --name new-cred-name
```

### pg:credentials:destroy

destroy credential within database

```
USAGE
  $ heroku pg:credentials:destroy [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        (required) unique identifier for the credential
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:destroy postgresql-transparent-56874 --name cred-name -a woodstock-production
```

### pg:credentials:repair-default

repair the permissions of the default credential within database

```
USAGE
  $ heroku pg:credentials:repair-default [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:credentials:repair-default postgresql-something-12345
```

### pg:credentials:rotate

rotate the database credentials

```
USAGE
  $ heroku pg:credentials:rotate [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -n, --name=name        which credential to rotate (default credentials if not specified)
  -r, --remote=remote    git remote of app to use
  --all                  rotate all credentials
  --force                forces rotating the targeted credentials
```

### pg:credentials:url

show information on a database credential

```
USAGE
  $ heroku pg:credentials:url [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --name=name      which credential to show (default credentials if not specified)
  -r, --remote=remote  git remote of app to use
```

### pg:diagnose

run or view diagnostics report

```
USAGE
  $ heroku pg:diagnose [DATABASE|REPORT_ID] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION

  defaults to DATABASE_URL database if no DATABASE is specified
  if REPORT_ID is specified instead, a previous report is displayed
```

### pg:info

show database information

```
USAGE
  $ heroku pg:info [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:kill

kill a query

```
USAGE
  $ heroku pg:kill PID [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

#### pg:killall

terminates all connections for all credentials

```
USAGE
  $ heroku pg:killall [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:killall

terminates all connections for all credentials

```
USAGE
  $ heroku pg:killall [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:links

lists all databases and information on link

```
USAGE
  $ heroku pg:links [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:links:create

create a link between data stores

```
USAGE
  $ heroku pg:links:create REMOTE DATABASE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --as=as              name of link to create

DESCRIPTION
  Example:

       heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN
```

#### pg:links:destroy

destroys a link between data stores

```
USAGE
  $ heroku pg:links:destroy DATABASE LINK [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100
```

### pg:links:create

create a link between data stores

```
USAGE
  $ heroku pg:links:create REMOTE DATABASE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --as=as              name of link to create

DESCRIPTION
  Example:

       heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN
```

### pg:links:destroy

destroys a link between data stores

```
USAGE
  $ heroku pg:links:destroy DATABASE LINK [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  Example:

       heroku pg:links:destroy HEROKU_POSTGRESQL_CERULEAN redis-symmetrical-100
```

### pg:maintenance

show current maintenance information

```
USAGE
  $ heroku pg:maintenance [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:maintenance:run

start maintenance

```
USAGE
  $ heroku pg:maintenance:run [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

#### pg:maintenance:window

set weekly maintenance window

```
USAGE
  $ heroku pg:maintenance:window DATABASE WINDOW [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  All times are in UTC.

  Example:

       heroku pg:maintenance:window postgres-slippery-100 "Sunday 06:00"
```

### pg:maintenance:run

start maintenance

```
USAGE
  $ heroku pg:maintenance:run [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force
  -r, --remote=remote  git remote of app to use
```

### pg:maintenance:window

set weekly maintenance window

```
USAGE
  $ heroku pg:maintenance:window DATABASE WINDOW [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  All times are in UTC.

  Example:

       heroku pg:maintenance:window postgres-slippery-100 "Sunday 06:00"
```

### pg:outliers

show 10 queries that have longest execution time in aggregate

```
USAGE
  $ heroku pg:outliers [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --num=num        the number of queries to display (default: 10)
  -r, --remote=remote  git remote of app to use
  -t, --truncate       truncate queries to 40 characters
  --reset              resets statistics gathered by pg_stat_statements
```

### pg:promote

sets DATABASE as your DATABASE_URL

```
USAGE
  $ heroku pg:promote DATABASE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### pg:ps

view active queries with execution time

```
USAGE
  $ heroku pg:ps [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -v, --verbose
```

#### pg:psql

open a psql shell to the database

```
USAGE
  $ heroku pg:psql [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app            (required) app to run command against
  -c, --command=command    SQL command to run
  -r, --remote=remote      git remote of app to use
  --credential=credential  credential to use
```

### pg:psql

open a psql shell to the database

```
USAGE
  $ heroku pg:psql [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app            (required) app to run command against
  -c, --command=command    SQL command to run
  -r, --remote=remote      git remote of app to use
  --credential=credential  credential to use
```

### pg:pull

pull Heroku database into local or remote database

```
USAGE
  $ heroku pg:pull SOURCE TARGET [OPTIONS]

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

### pg:push

push local or remote into Heroku database

```
USAGE
  $ heroku pg:push SOURCE TARGET [OPTIONS]

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

### pg:reset

delete all data in DATABASE

```
USAGE
  $ heroku pg:reset [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

### pg:settings

show your current database settings

```
USAGE
  $ heroku pg:settings [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

#### pg:settings:log-lock-waits

Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second

```
USAGE
  $ heroku pg:settings:log-lock-waits [VALUE] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same 
  time.
  Applications and their query patterns should try to avoid changes to many different tables within the same 
  transaction.
```

#### pg:settings:log-min-duration-statement

The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.

```
USAGE
  $ heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  VALUE needs to specified as a whole number, in milliseconds.
  Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement 
  durations.
```

#### pg:settings:log-statement

log_statement controls which SQL statements are logged.

```
USAGE
  $ heroku pg:settings:log-statement [VALUE] [DATABASE] [OPTIONS]

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

### pg:settings:log-lock-waits

Controls whether a log message is produced when a session waits longer than the deadlock_timeout to acquire a lock. deadlock_timeout is set to 1 second

```
USAGE
  $ heroku pg:settings:log-lock-waits [VALUE] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Delays due to lock contention occur when multiple transactions are trying to access the same resource at the same 
  time.
  Applications and their query patterns should try to avoid changes to many different tables within the same 
  transaction.
```

### pg:settings:log-min-duration-statement

The duration of each completed statement will be logged if the statement completes after the time specified by VALUE.

```
USAGE
  $ heroku pg:settings:log-min-duration-statement [VALUE] [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  VALUE needs to specified as a whole number, in milliseconds.
  Setting log_min_duration_statement to zero prints all statement durations and -1 will disable logging statement 
  durations.
```

### pg:settings:log-statement

log_statement controls which SQL statements are logged.

```
USAGE
  $ heroku pg:settings:log-statement [VALUE] [DATABASE] [OPTIONS]

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

### pg:unfollow

stop a replica from following and make it a writeable database

```
USAGE
  $ heroku pg:unfollow DATABASE [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

### pg:upgrade

unfollow a database and upgrade it to the latest stable PostgreSQL version

```
USAGE
  $ heroku pg:upgrade [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  to upgrade to another PostgreSQL version, use pg:copy instead
```

### pg:wait

blocks until database is available

```
USAGE
  $ heroku pg:wait [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app                  (required) app to run command against
  -r, --remote=remote            git remote of app to use
  --wait-interval=wait-interval  how frequently to poll in seconds (to avoid rate limiting)
```
