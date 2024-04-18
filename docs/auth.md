`heroku auth`
=============

manage authentication for your Heroku account

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

DESCRIPTION
  check 2fa status

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

_See code: [src/commands/auth/2fa/index.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/2fa/index.ts)_

## `heroku auth:2fa:disable`

disables 2fa on account

```
USAGE
  $ heroku auth:2fa:disable

DESCRIPTION
  disables 2fa on account

ALIASES
  $ heroku twofactor:disable
  $ heroku 2fa:disable

EXAMPLES
  $ heroku auth:2fa:disable
```

_See code: [src/commands/auth/2fa/disable.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/2fa/disable.ts)_

## `heroku auth:login`

login with your Heroku credentials

```
USAGE
  $ heroku auth:login [--browser <value>] [-i] [-e <value>]

FLAGS
  -e, --expires-in=<value>  duration of token in seconds (default 30 days)
  -i, --interactive         login with username/password
  --browser=<value>         browser to open SSO with (example: "firefox", "safari")

DESCRIPTION
  login with your Heroku credentials

ALIASES
  $ heroku login
```

_See code: [src/commands/auth/login.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/login.ts)_

## `heroku auth:logout`

clears local login credentials and invalidates API session

```
USAGE
  $ heroku auth:logout

DESCRIPTION
  clears local login credentials and invalidates API session

ALIASES
  $ heroku logout
```

_See code: [src/commands/auth/logout.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/logout.ts)_

## `heroku auth:token`

outputs current CLI authentication token.

```
USAGE
  $ heroku auth:token [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  outputs current CLI authentication token.
  By default, the CLI auth token is only valid for 1 year. To generate a long-lived token, use heroku
  authorizations:create
```

_See code: [src/commands/auth/token.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/token.ts)_

## `heroku auth:whoami`

display the current logged in user

```
USAGE
  $ heroku auth:whoami

DESCRIPTION
  display the current logged in user

ALIASES
  $ heroku whoami
```

_See code: [src/commands/auth/whoami.ts](https://github.com/heroku/cli/blob/v9.0.0-alpha.1/src/commands/auth/whoami.ts)_
