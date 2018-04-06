heroku auth
===========

login with your Heroku credentials

* [heroku auth:2fa](#heroku-auth-2-fa)
* [heroku auth:2fa:disable](#heroku-auth-2-fadisable)
* [heroku auth:2fa:generate](#heroku-auth-2-fagenerate)
* [heroku auth:login](#heroku-authlogin)
* [heroku auth:logout](#heroku-authlogout)
* [heroku auth:token](#heroku-authtoken)

## heroku auth:2fa

check 2fa status

```
USAGE
  $ heroku auth:2fa

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

### heroku auth:2fa:disable

disable 2fa on account

```
USAGE
  $ heroku auth:2fa:disable
```

### heroku auth:2fa:generate

generates and replaces recovery codes

```
USAGE
  $ heroku auth:2fa:generate
```

## heroku auth:2fa:disable

disable 2fa on account

```
USAGE
  $ heroku auth:2fa:disable
```

## heroku auth:2fa:generate

generates and replaces recovery codes

```
USAGE
  $ heroku auth:2fa:generate
```

## heroku auth:login

login with your Heroku credentials

```
USAGE
  $ heroku auth:login

OPTIONS
  -e, --expires-in=expires-in  duration of token in seconds (default 1 year)
  --browser                    browser to open SSO with
  --sso                        login for enterprise users under SSO

ALIASES
  $ heroku login
```

## heroku auth:logout

clears local login credentials

```
USAGE
  $ heroku auth:logout
```

## heroku auth:token

display the current auth token

```
USAGE
  $ heroku auth:token
```
