`heroku auth`
=============

login with your Heroku credentials

* [`heroku auth:2fa`](#heroku-auth-2-fa)
* [`heroku auth:2fa:disable`](#heroku-auth-2-fadisable)
* [`heroku auth:2fa:generate-recovery-codes`](#heroku-auth-2-fagenerate-recovery-codes)
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

## `heroku auth:2fa`

check 2fa status

```
USAGE
  $ heroku auth:2fa

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/2fa/index.ts)_

## `heroku auth:2fa:disable`

disables 2fa on account

```
USAGE
  $ heroku auth:2fa:disable

ALIASES
  $ heroku twofactor:disable
  $ heroku 2fa:disable

EXAMPLES
  $ heroku auth:2fa:disable
  Disabling 2fa on me@example.com... done
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/2fa/disable.ts)_

## `heroku auth:2fa:generate-recovery-codes`

generates 2fa recovery codes

```
USAGE
  $ heroku auth:2fa:generate-recovery-codes

DESCRIPTION
  If you lose access to your two-factor device, e.g. you lose your phone or it is wiped, you can still log in to your 
  account. When prompted for the second factor after entering your account password, choose "Enter a Recovery Code.” You 
  can then enter one of your recovery codes instead of a token from your two-factor device. Note that each recovery code 
  can only be used once.

  Running this command will replace existing codes.

ALIASES
  $ heroku twofactor:generate-recovery-codes
  $ heroku 2fa:generate-recovery-codes
  $ heroku auth:2fa:generate

EXAMPLES
  $ heroku auth:2fa:generate
  Password: ********************
  Recovery codes:
  02799c92ab3ba7c7
  09aea052a72b6a22
  361e00bb82c7cbd4
  588ac05dec23952c
  6020ef9ec364066b
  6cfd923315875e78
  7c576b935eafc452
  8c00eeb258ee565e
  a37c5c6985f56e66
  f82e7c2a50737494
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/2fa/generate-recovery-codes.ts)_

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

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/login.ts)_

## `heroku auth:logout`

clears local login credentials and invalidates API session

```
USAGE
  $ heroku auth:logout

ALIASES
  $ heroku logout
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/logout.ts)_

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

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/token.ts)_

## `heroku auth:whoami`

display the current logged in user

```
USAGE
  $ heroku auth:whoami

ALIASES
  $ heroku whoami
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/heroku-cli-plugin-auth/blob/v0.6.0/src/commands/auth/whoami.ts)_

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
