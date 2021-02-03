`heroku auth`
=============

check 2fa status

* [`heroku auth:2fa`](#heroku-auth2fa)
* [`heroku auth:2fa:disable`](#heroku-auth2fadisable)
* [`heroku auth:login`](#heroku-authlogin)
* [`heroku auth:logout`](#heroku-authlogout)
* [`heroku auth:token`](#heroku-authtoken)
* [`heroku auth:whoami`](#heroku-authwhoami)

## `heroku auth:2fa`

check 2fa status

```
USAGE
  $ heroku auth:2fa

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/2fa/index.ts)_

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

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/2fa/disable.ts)_

## `heroku auth:login`

login with your Heroku credentials

```
USAGE
  $ heroku auth:login

OPTIONS
  -e, --expires-in=expires-in  duration of token in seconds (default 1 year)
  -i, --interactive            login with username/password
  --browser=browser            browser to open SSO with (example: "firefox", "safari")

ALIASES
  $ heroku login
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/login.ts)_

## `heroku auth:logout`

clears local login credentials and invalidates API session

```
USAGE
  $ heroku auth:logout

ALIASES
  $ heroku logout
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/logout.ts)_

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

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/token.ts)_

## `heroku auth:whoami`

display the current logged in user

```
USAGE
  $ heroku auth:whoami

ALIASES
  $ heroku whoami
```

_See code: [@heroku-cli/plugin-auth](https://github.com/heroku/cli/blob/v7.47.12/packages/auth/src/commands/auth/whoami.ts)_
