`heroku authorizations`
=======================

OAuth authorizations
* [`heroku authorizations`](#heroku-authorizations)
* [`heroku authorizations:create`](#heroku-authorizationscreate)
* [`heroku authorizations:info ID`](#heroku-authorizationsinfo-id)
* [`heroku authorizations:revoke ID`](#heroku-authorizationsrevoke-id)
* [`heroku authorizations:rotate ID`](#heroku-authorizationsrotate-id)
* [`heroku authorizations:update ID`](#heroku-authorizationsupdate-id)

## `heroku authorizations`

list OAuth authorizations

```
USAGE
  $ heroku authorizations

OPTIONS
  -j, --json  output in json format
```

## `heroku authorizations:create`

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create

OPTIONS
  -S, --short                    only output token
  -d, --description=description  set a custom authorization description
  -e, --expires-in=expires-in    set expiration in seconds (default no expiration)
  -j, --json                     output in json format
  -s, --scope=scope              set custom OAuth scopes

DESCRIPTION
  This creates an authorization with access to your Heroku account.
```

## `heroku authorizations:info ID`

show an existing OAuth authorization

```
USAGE
  $ heroku authorizations:info ID

OPTIONS
  -j, --json  output in json format
```

## `heroku authorizations:revoke ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID
```

## `heroku authorizations:rotate ID`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate ID
```

## `heroku authorizations:update ID`

updates an OAuth authorization

```
USAGE
  $ heroku authorizations:update ID

OPTIONS
  -d, --description=description  set a custom authorization description
  --client-id=client-id          identifier of OAuth client to set
  --client-secret=client-secret  secret of OAuth client to set
```
