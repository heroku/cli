`heroku auth`
=============

login with your Heroku credentials

* [`heroku auth:2fa:disable`](#heroku-auth-2-fadisable)
* [`heroku auth:2fa:generate`](#heroku-auth-2-fagenerate)
* [`heroku auth:login`](#heroku-authlogin)
* [`heroku auth:logout`](#heroku-authlogout)
* [`heroku auth:token`](#heroku-authtoken)
* [`heroku auth:whoami`](#heroku-authwhoami)
* [`heroku authorizations`](#heroku-authorizations)
* [`heroku authorizations:create`](#heroku-authorizationscreate)
* [`heroku authorizations:info ID`](#heroku-authorizationsinfo-id)
* [`heroku authorizations:revoke ID`](#heroku-authorizationsrevoke-id)
* [`heroku authorizations:rotate ID`](#heroku-authorizationsrotate-id)
* [`heroku authorizations:update ID`](#heroku-authorizationsupdate-id)

## `heroku auth:2fa:disable`

disable 2fa on account

```
USAGE
  $ heroku auth:2fa:disable
```

## `heroku auth:2fa:generate`

generates and replaces recovery codes

```
USAGE
  $ heroku auth:2fa:generate
```

## `heroku auth:login`

login with your Heroku credentials

```
USAGE
  $ heroku auth:login

OPTIONS
  -e, --expires-in=expires-in  duration of token in seconds (default 1 year)
  -i, --interactive            login with username/password
  -s, --sso                    login for enterprise users under SSO
  --browser=browser            browser to open SSO with

ALIASES
  $ heroku login
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.4.4/src/commands/auth/login.ts)_

## `heroku auth:logout`

clears local login credentials and invalidates API session

```
USAGE
  $ heroku auth:logout

ALIASES
  $ heroku logout
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.4.4/src/commands/auth/logout.ts)_

## `heroku auth:token`

outputs current CLI authentication token.

```
USAGE
  $ heroku auth:token

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  By default, the CLI auth token is only valid for 1 year. To generate a long-lived token, use heroku 
  authorizations:create
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.4.4/src/commands/auth/token.ts)_

## `heroku auth:whoami`

display the current logged in user

```
USAGE
  $ heroku auth:whoami

ALIASES
  $ heroku whoami
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.4.4/src/commands/auth/whoami.ts)_

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
