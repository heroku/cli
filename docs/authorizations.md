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

EXAMPLES
  $ heroku authorizations
```

_See code: [src/commands/authorizations/index.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/index.ts)_

## `heroku authorizations:create`

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create [-d <value>] [-S] [-j] [-s <value>] [-e <value>]

FLAGS
  -S, --short                only output token
  -d, --description=<value>  set a custom authorization
  -e, --expires-in=<value>   set expiration in seconds (default no expiration)
  -j, --json                 output in json format
  -s, --scope=<value>        set custom OAuth scopes

DESCRIPTION
  create a new OAuth authorization

EXAMPLES
  $ heroku authorizations:create --description "For use with Anvil"
```

_See code: [src/commands/authorizations/create.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/create.ts)_

## `heroku authorizations:destroy ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:destroy ID

DESCRIPTION
  revoke OAuth authorization

ALIASES
  $ heroku authorizations:revoke
  $ heroku authorizations:destroy

EXAMPLES
  $ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
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

_See code: [src/commands/authorizations/info.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/info.ts)_

## `heroku authorizations:revoke ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID

DESCRIPTION
  revoke OAuth authorization

ALIASES
  $ heroku authorizations:revoke
  $ heroku authorizations:destroy

EXAMPLES
  $ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
```

_See code: [src/commands/authorizations/revoke.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/revoke.ts)_

## `heroku authorizations:rotate ID`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate ID

DESCRIPTION
  updates an OAuth authorization token
```

_See code: [src/commands/authorizations/rotate.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/rotate.ts)_

## `heroku authorizations:update ID`

updates an OAuth authorization

```
USAGE
  $ heroku authorizations:update ID [-d <value>] [--client-id <value> --client-secret <value>]

FLAGS
  -d, --description=<value>  set a custom authorization description
  --client-id=<value>        identifier of OAuth client to set
  --client-secret=<value>    secret of OAuth client to set

DESCRIPTION
  updates an OAuth authorization
```

_See code: [src/commands/authorizations/update.ts](https://github.com/heroku/cli/blob/v8.8.0/src/commands/authorizations/update.ts)_
