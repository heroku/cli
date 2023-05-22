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

DESCRIPTION
  check 2fa status

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

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
