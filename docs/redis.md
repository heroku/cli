`heroku redis`
==============

manage heroku redis instances

* [`heroku redis [DATABASE]`](#heroku-redis-database)
* [`heroku redis:cli [DATABASE]`](#heroku-rediscli-database)
* [`heroku redis:credentials [DATABASE]`](#heroku-rediscredentials-database)
* [`heroku redis:info [DATABASE]`](#heroku-redisinfo-database)
* [`heroku redis:keyspace-notifications [DATABASE]`](#heroku-rediskeyspace-notifications-database)
* [`heroku redis:maintenance [DATABASE]`](#heroku-redismaintenance-database)
* [`heroku redis:maxmemory [DATABASE]`](#heroku-redismaxmemory-database)
* [`heroku redis:promote [DATABASE]`](#heroku-redispromote-database)
* [`heroku redis:stats-reset [DATABASE]`](#heroku-redisstats-reset-database)
* [`heroku redis:timeout [DATABASE]`](#heroku-redistimeout-database)
* [`heroku redis:upgrade [DATABASE]`](#heroku-redisupgrade-database)
* [`heroku redis:wait [DATABASE]`](#heroku-rediswait-database)

## `heroku redis [DATABASE]`

gets information about redis

```
USAGE
  $ heroku redis [DATABASE] -a <value> [-r <value>] [-j]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -j, --json            output in json format
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  gets information about redis

ALIASES
  $ heroku redis
```

## `heroku redis:cli [DATABASE]`

opens a redis prompt

```
USAGE
  $ heroku redis:cli [DATABASE] -a <value> [-c <value>] [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  opens a redis prompt

EXAMPLES
  $ heroku redis:cli --app=my-app my-database

  $ heroku redis:cli --app=my-app --confirm my-database
```

_See code: [src/commands/redis/cli.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/cli.ts)_

## `heroku redis:credentials [DATABASE]`

display credentials information

```
USAGE
  $ heroku redis:credentials [DATABASE] -a <value> [-r <value>] [--reset]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --reset           reset credentials

DESCRIPTION
  display credentials information
```

_See code: [src/commands/redis/credentials.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/credentials.ts)_

## `heroku redis:info [DATABASE]`

gets information about redis

```
USAGE
  $ heroku redis:info [DATABASE] -a <value> [-r <value>] [-j]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -j, --json            output in json format
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  gets information about redis

ALIASES
  $ heroku redis
```

_See code: [src/commands/redis/info.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/info.ts)_

## `heroku redis:keyspace-notifications [DATABASE]`

set the keyspace notifications configuration

```
USAGE
  $ heroku redis:keyspace-notifications [DATABASE] -a <value> -c <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -c, --config=<value>  (required) set keyspace notifications configuration
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set the keyspace notifications configuration
  Set the configuration to enable keyspace notification events:
  K     Keyspace events, published with __keyspace@<db>__ prefix.
  E     Keyevent events, published with __keyevent@<db>__ prefix.
  g     Generic commands (non-type specific) like DEL, EXPIRE, RENAME, ...
  $     String commands
  l     List commands
  s     Set commands
  h     Hash commands
  z     Sorted set commands
  t     Stream commands
  x     Expired events (events generated every time a key expires)
  e     Evicted events (events generated when a key is evicted for maxmemory)
  m     Key miss events (events generated when a key that doesn't exist is accessed)
  A     Alias for "g$lshztxe", so that the "AKE" string means all the events except "m".

  pass an empty string ('') to disable keyspace notifications
```

_See code: [src/commands/redis/keyspace-notifications.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/keyspace-notifications.ts)_

## `heroku redis:maintenance [DATABASE]`

manage maintenance windows

```
USAGE
  $ heroku redis:maintenance [DATABASE] -a <value> [-r <value>] [-w <value>] [--run] [-f]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -f, --force           start maintenance without entering application maintenance mode
  -r, --remote=<value>  git remote of app to use
  -w, --window=<value>  set weekly UTC maintenance window (format: "Day HH:MM", where MM is 00 or 30)
      --run             start maintenance

DESCRIPTION
  manage maintenance windows
  Set or change the maintenance window for your Redis instance
```

_See code: [src/commands/redis/maintenance.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/maintenance.ts)_

## `heroku redis:maxmemory [DATABASE]`

set the key eviction policy when instances reach their storage limit

```
USAGE
  $ heroku redis:maxmemory [DATABASE] -a <value> -p <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -p, --policy=<value>  (required) set policy name
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set the key eviction policy when instances reach their storage limit
  Available policies for key eviction include:

  noeviction      # returns errors when memory limit is reached
  allkeys-lfu     # removes less frequently used keys first
  volatile-lfu    # removes less frequently used keys first that have an expiry set
  allkeys-lru     # removes less recently used keys first
  volatile-lru    # removes less recently used keys first that have an expiry set
  allkeys-random  # evicts random keys
  volatile-random # evicts random keys but only those that have an expiry set
  volatile-ttl    # only evicts keys with an expiry set and a short TTL
```

_See code: [src/commands/redis/maxmemory.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/maxmemory.ts)_

## `heroku redis:promote [DATABASE]`

sets DATABASE as your REDIS_URL

```
USAGE
  $ heroku redis:promote [DATABASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  sets DATABASE as your REDIS_URL
```

_See code: [src/commands/redis/promote.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/promote.ts)_

## `heroku redis:stats-reset [DATABASE]`

reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)

```
USAGE
  $ heroku redis:stats-reset [DATABASE] -a <value> [-r <value>] [-c <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)
```

_See code: [src/commands/redis/stats-reset.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/stats-reset.ts)_

## `heroku redis:timeout [DATABASE]`

set the number of seconds to wait before killing idle connections

```
USAGE
  $ heroku redis:timeout [DATABASE] -a <value> -s <value> [-r <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -r, --remote=<value>   git remote of app to use
  -s, --seconds=<value>  (required) set timeout value

DESCRIPTION
  set the number of seconds to wait before killing idle connections
  A value of zero means that connections will not be closed.
```

_See code: [src/commands/redis/timeout.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/timeout.ts)_

## `heroku redis:upgrade [DATABASE]`

perform in-place version upgrade

```
USAGE
  $ heroku redis:upgrade [DATABASE] -a <value> -v <value> [-r <value>] [-c <value>]

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use
  -v, --version=<value>  (required)

DESCRIPTION
  perform in-place version upgrade
```

_See code: [src/commands/redis/upgrade.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/upgrade.ts)_

## `heroku redis:wait [DATABASE]`

wait for Redis instance to be available

```
USAGE
  $ heroku redis:wait [DATABASE] -a <value> [--wait-interval <value>] [-r <value>]

FLAGS
  -a, --app=<value>            (required) app to run command against
  -r, --remote=<value>         git remote of app to use
      --wait-interval=<value>  how frequently to poll in seconds

DESCRIPTION
  wait for Redis instance to be available
```

_See code: [src/commands/redis/wait.ts](https://github.com/heroku/cli/blob/v9.0.0-beta.3/packages/cli/src/commands/redis/wait.ts)_
