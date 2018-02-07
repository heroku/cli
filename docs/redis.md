heroku redis
============


# Commands

* [heroku redis [DATABASE] [OPTIONS]](#redis)
* [heroku redis:cli [DATABASE] [OPTIONS]](#rediscli)
* [heroku redis:credentials [DATABASE] [OPTIONS]](#rediscredentials)
* [heroku redis:info [DATABASE] [OPTIONS]](#redisinfo)
* [heroku redis:maintenance [DATABASE] [OPTIONS]](#redismaintenance)
* [heroku redis:maxmemory [DATABASE] [OPTIONS]](#redismaxmemory)
* [heroku redis:promote DATABASE [OPTIONS]](#redispromote)
* [heroku redis:timeout [DATABASE] [OPTIONS]](#redistimeout)
* [heroku redis:wait [DATABASE] [OPTIONS]](#rediswait)
## redis

gets information about redis

```
USAGE
  $ heroku redis [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### redis:cli

opens a redis prompt

```
USAGE
  $ heroku redis:cli [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use
```

### redis:credentials

display credentials information

```
USAGE
  $ heroku redis:credentials [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --reset              reset credentials
```

### redis:info

gets information about redis

```
USAGE
  $ heroku redis:info [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### redis:maintenance

manage maintenance windows

```
USAGE
  $ heroku redis:maintenance [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -f, --force          start maintenance without entering application maintenance mode
  -r, --remote=remote  git remote of app to use
  -w, --window=window  set weekly UTC maintenance window
  --run                start maintenance

DESCRIPTION
  Set or change the maintenance window for your Redis instance
```

### redis:maxmemory

set the key eviction policy

```
USAGE
  $ heroku redis:maxmemory [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -p, --policy=policy  (required) set policy name
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Set the key eviction policy when instance reaches its storage limit. Available policies for key eviction include:

       noeviction      # returns errors when memory limit is reached
       allkeys-lru     # removes less recently used keys first
       volatile-lru    # removes less recently used keys first that have an expiry set
       allkeys-random  # evicts random keys
       volatile-random # evicts random keys but only those that have an expiry set
       volatile-ttl    # only evicts keys with an expiry set and a short TTL
```

### redis:promote

sets DATABASE as your REDIS_URL

```
USAGE
  $ heroku redis:promote DATABASE [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

### redis:timeout

set the number of seconds to wait before killing idle connections

```
USAGE
  $ heroku redis:timeout [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app          (required) app to run command against
  -r, --remote=remote    git remote of app to use
  -s, --seconds=seconds  set timeout value

DESCRIPTION
  Sets the number of seconds to wait before killing idle connections. A value of zero means that connections will not be 
  closed.
```

### redis:wait

wait for Redis instance to be available

```
USAGE
  $ heroku redis:wait [DATABASE] [OPTIONS]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```
