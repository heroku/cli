`heroku authorizations`
=======================

OAuth authorizations

* [`heroku authorizations`](#heroku-authorizations)
* [`heroku authorizations:create`](#heroku-authorizationscreate)
* [`heroku authorizations:destroy ID`](#heroku-authorizationsdestroy-id)
* [`heroku authorizations:info ID`](#heroku-authorizationsinfo-id)
* [`heroku authorizations:revoke ID`](#heroku-authorizationsrevoke-id)
* [`heroku authorizations:rotate ID`](#heroku-authorizationsrotate-id)
* [`heroku authorizations:update ID`](#heroku-authorizationsupdate-id)

## `heroku authorizations`

list OAuth authorizations

```
USAGE
  $ heroku authorizations [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  list OAuth authorizations
```

## `heroku authorizations:create`

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create [-d <value>] [-s <value>] [-e <value>] [-S] [-j]

FLAGS
  -S, --short                only output token
  -d, --description=<value>  set a custom authorization description
  -e, --expires-in=<value>   set expiration in seconds (default no expiration)
  -j, --json                 output in json format
  -s, --scope=<value>        set custom OAuth scopes

DESCRIPTION
  create a new OAuth authorization
  This creates an authorization with access to your Heroku account.
```

## `heroku authorizations:destroy ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:destroy ID

DESCRIPTION
  revoke OAuth authorization


ALIASES
  $ heroku authorizations:destroy
  $ heroku authorizations:revoke
```

## `heroku authorizations:info ID`

show an existing OAuth authorization

```
USAGE
  $ heroku authorizations:info ID [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  show an existing OAuth authorization
```

## `heroku authorizations:revoke ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID

DESCRIPTION
  revoke OAuth authorization


ALIASES
  $ heroku authorizations:destroy
  $ heroku authorizations:revoke
```

## `heroku authorizations:rotate ID`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate ID

DESCRIPTION
  updates an OAuth authorization token
```

## `heroku authorizations:update ID`

updates an OAuth authorization

```
USAGE
  $ heroku authorizations:update ID [-d <value>] [--client-id <value>] [--client-secret <value>]

FLAGS
  -d, --description=<value>  set a custom authorization description
  --client-id=<value>        identifier of OAuth client to set
  --client-secret=<value>    secret of OAuth client to set

DESCRIPTION
  updates an OAuth authorization
```
