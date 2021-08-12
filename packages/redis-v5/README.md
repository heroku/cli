# heroku-redis-jsplugin

An Heroku CLI plugin for managing Heroku Redis instances.

## Installation

Use ``plugins:install`` to install it:

```console
heroku plugins:install heroku-redis
```

## Usage

CLI commands are described in the [Heroku Redis devcenter article](https://devcenter.heroku.com/articles/heroku-redis#using-the-cli).


## Publishing

To publish new versions, see
[the data plugin documentation](https://github.com/heroku/dod-ops/blob/master/playbooks/cli-plugins.md).

<!-- commands -->
* [`heroku redis [DATABASE]`](#heroku-redis-database)
* [`heroku redis:cli [DATABASE]`](#heroku-rediscli-database)
* [`heroku redis:credentials [DATABASE]`](#heroku-rediscredentials-database)
* [`heroku redis:info [DATABASE]`](#heroku-redisinfo-database)
* [`heroku redis:keyspace-notifications [DATABASE]`](#heroku-rediskeyspace-notifications-database)
* [`heroku redis:maintenance [DATABASE]`](#heroku-redismaintenance-database)
* [`heroku redis:maxmemory [DATABASE]`](#heroku-redismaxmemory-database)
* [`heroku redis:promote DATABASE`](#heroku-redispromote-database)
* [`heroku redis:stats-reset [DATABASE]`](#heroku-redisstats-reset-database)
* [`heroku redis:timeout [DATABASE]`](#heroku-redistimeout-database)
* [`heroku redis:upgrade [DATABASE]`](#heroku-redisupgrade-database)
* [`heroku redis:wait [DATABASE]`](#heroku-rediswait-database)

## `heroku redis [DATABASE]`

gets information about redis

```
USAGE
  $ heroku redis [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               format output as JSON
```

## `heroku redis:cli [DATABASE]`

opens a redis prompt

```
USAGE
  $ heroku redis:cli [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

## `heroku redis:credentials [DATABASE]`

display credentials information

```
USAGE
  $ heroku redis:credentials [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --reset              reset credentials
```

## `heroku redis:info [DATABASE]`

gets information about redis

```
USAGE
  $ heroku redis:info [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               format output as JSON
```

## `heroku redis:keyspace-notifications [DATABASE]`

set the keyspace notifications configuration

```
USAGE
  $ heroku redis:keyspace-notifications [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -c, --config=config  (required) set keyspace notifications configuration
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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

## `heroku redis:maintenance [DATABASE]`

manage maintenance windows

```
USAGE
  $ heroku redis:maintenance [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force          start maintenance without entering application maintenance mode
  -r, --remote=remote  git remote of app to use
  -w, --window=window  set weekly UTC maintenance window
  --run                start maintenance

DESCRIPTION
  Set or change the maintenance window for your Redis instance
```

## `heroku redis:maxmemory [DATABASE]`

set the key eviction policy

```
USAGE
  $ heroku redis:maxmemory [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -p, --policy=policy  (required) set policy name
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Set the key eviction policy when instance reaches its storage limit. Available policies for key eviction include:

       noeviction      # returns errors when memory limit is reached
       allkeys-lfu     # removes less frequently used keys first
       volatile-lfu    # removes less frequently used keys first that have an expiry set
       allkeys-lru     # removes less recently used keys first
       volatile-lru    # removes less recently used keys first that have an expiry set
       allkeys-random  # evicts random keys
       volatile-random # evicts random keys but only those that have an expiry set
       volatile-ttl    # only evicts keys with an expiry set and a short TTL
```

## `heroku redis:promote DATABASE`

sets DATABASE as your REDIS_URL

```
USAGE
  $ heroku redis:promote DATABASE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku redis:stats-reset [DATABASE]`

reset all stats covered by RESETSTAT (https://redis.io/commands/config-resetstat)

```
USAGE
  $ heroku redis:stats-reset [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

## `heroku redis:timeout [DATABASE]`

set the number of seconds to wait before killing idle connections

```
USAGE
  $ heroku redis:timeout [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -r, --remote=remote    git remote of app to use
  -s, --seconds=seconds  set timeout value

DESCRIPTION
  Sets the number of seconds to wait before killing idle connections. A value of zero means that connections will not be 
  closed.
```

## `heroku redis:upgrade [DATABASE]`

perform in-place version upgrade

```
USAGE
  $ heroku redis:upgrade [DATABASE]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
  -v, --version=version
```

## `heroku redis:wait [DATABASE]`

wait for Redis instance to be available

```
USAGE
  $ heroku redis:wait [DATABASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
<!-- commandsstop -->
