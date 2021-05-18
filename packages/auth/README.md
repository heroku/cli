@heroku-cli/plugin-auth
=======================

auth core plugin for Heroku CLI

[![Version](https://img.shields.io/npm/v/@heroku-cli/plugin-auth.svg)](https://npmjs.org/package/@heroku-cli/plugin-auth)
[![CircleCI](https://circleci.com/gh/heroku/heroku-cli-plugin-auth/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/heroku-cli-plugin-auth/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/heroku/heroku-cli-plugin-auth?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/heroku-cli-plugin-auth/branch/master)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/plugin-auth.svg)](https://npmjs.org/package/@heroku-cli/plugin-auth)
[![License](https://img.shields.io/npm/l/@heroku-cli/plugin-auth.svg)](https://github.com/heroku/heroku-cli-plugin-auth/blob/master/package.json)

<!-- toc -->
* [Commands](#commands)
<!-- tocstop -->
# Commands
<!-- commands -->
* [`heroku auth:2fa`](#heroku-auth2fa)
* [`heroku auth:2fa:disable`](#heroku-auth2fadisable)
* [`heroku auth:login`](#heroku-authlogin)
* [`heroku auth:logout`](#heroku-authlogout)
* [`heroku auth:token`](#heroku-authtoken)
* [`heroku auth:whoami`](#heroku-authwhoami)
* [`heroku labs:disable [FEATURE]`](#heroku-labsdisable-feature)

## `heroku auth:2fa`

check 2fa status

```
USAGE
  $ heroku auth:2fa

ALIASES
  $ heroku 2fa
  $ heroku twofactor
```

_See code: [src/commands/auth/2fa/index.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/2fa/index.ts)_

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
```

_See code: [src/commands/auth/2fa/disable.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/2fa/disable.ts)_

## `heroku auth:login`

login with your Heroku credentials

```
USAGE
  $ heroku auth:login

OPTIONS
  -e, --expires-in=expires-in  duration of token in seconds (default 30 days)
  -i, --interactive            login with username/password
  --browser=browser            browser to open SSO with (example: "firefox", "safari")

ALIASES
  $ heroku login
```

_See code: [src/commands/auth/login.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/login.ts)_

## `heroku auth:logout`

clears local login credentials and invalidates API session

```
USAGE
  $ heroku auth:logout

ALIASES
  $ heroku logout
```

_See code: [src/commands/auth/logout.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/logout.ts)_

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

_See code: [src/commands/auth/token.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/token.ts)_

## `heroku auth:whoami`

display the current logged in user

```
USAGE
  $ heroku auth:whoami

ALIASES
  $ heroku whoami
```

_See code: [src/commands/auth/whoami.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/auth/whoami.ts)_

## `heroku labs:disable [FEATURE]`

disables an experimental feature

```
USAGE
  $ heroku labs:disable [FEATURE]

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --confirm=confirm
```

_See code: [src/commands/labs/disable.ts](https://github.com/heroku/cli/blob/v7.54.0/packages/auth/src/commands/labs/disable.ts)_
<!-- commandsstop -->
