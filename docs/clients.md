`heroku clients`
================

OAuth clients on the platform

* [`heroku clients`](#heroku-clients)
* [`heroku clients:create NAME REDIRECT_URI`](#heroku-clientscreate-name-redirect-uri)
* [`heroku clients:destroy ID`](#heroku-clientsdestroy-id)
* [`heroku clients:info ID`](#heroku-clientsinfo-id)
* [`heroku clients:rotate ID`](#heroku-clientsrotate-id)
* [`heroku clients:update ID`](#heroku-clientsupdate-id)

## `heroku clients`

list your OAuth clients

```
USAGE
  $ heroku clients

OPTIONS
  -j, --json  output in json format
```

## `heroku clients:create NAME REDIRECT_URI`

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID
```

## `heroku clients:info ID`

show details of an oauth client

```
USAGE
  $ heroku clients:info ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

## `heroku clients:rotate ID`

rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

## `heroku clients:update ID`

update OAuth client

```
USAGE
  $ heroku clients:update ID

OPTIONS
  -n, --name=name  change the client name
  --url=url        change the client redirect URL
```
