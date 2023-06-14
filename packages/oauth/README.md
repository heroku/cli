oauth
=====

Command line plugin for managing OAuth clients, authorizations and tokens.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oauth.svg)](https://npmjs.org/package/oauth)
[![Downloads/week](https://img.shields.io/npm/dw/oauth.svg)](https://npmjs.org/package/oauth)
[![License](https://img.shields.io/npm/l/oauth.svg)](https://github.com/heroku/cli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-oauth
$ heroku COMMAND
running command...
$ heroku (--version|-v)
@heroku-cli/plugin-oauth/8.1.8 darwin-x64 node-v16.19.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku authorizations`](#heroku-authorizations)
* [`heroku authorizations:create`](#heroku-authorizationscreate)
* [`heroku authorizations:info ID`](#heroku-authorizationsinfo-id)
* [`heroku authorizations:revoke ID`](#heroku-authorizationsrevoke-id)
* [`heroku authorizations:rotate ID`](#heroku-authorizationsrotate-id)
* [`heroku authorizations:update ID`](#heroku-authorizationsupdate-id)
* [`heroku clients`](#heroku-clients)
* [`heroku clients:create NAME REDIRECT_URI`](#heroku-clientscreate-name-redirect_uri)
* [`heroku clients:destroy ID`](#heroku-clientsdestroy-id)
* [`heroku clients:info ID`](#heroku-clientsinfo-id)
* [`heroku clients:rotate ID`](#heroku-clientsrotate-id)
* [`heroku clients:update ID`](#heroku-clientsupdate-id)
* [`heroku sessions`](#heroku-sessions)
* [`heroku sessions:destroy ID`](#heroku-sessionsdestroy-id)

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

_See code: [src/commands/authorizations/index.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/index.ts)_

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

_See code: [src/commands/authorizations/create.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/create.ts)_

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

_See code: [src/commands/authorizations/info.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/info.ts)_

## `heroku authorizations:revoke ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID

DESCRIPTION
  revoke OAuth authorization

EXAMPLES
  $ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
```

_See code: [src/commands/authorizations/revoke.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/revoke.ts)_

## `heroku authorizations:rotate ID`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate ID

DESCRIPTION
  updates an OAuth authorization token
```

_See code: [src/commands/authorizations/rotate.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/rotate.ts)_

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

_See code: [src/commands/authorizations/update.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/authorizations/update.ts)_

## `heroku clients`

list your OAuth clients

```
USAGE
  $ heroku clients [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  list your OAuth clients
```

_See code: [src/commands/clients/index.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/index.ts)_

## `heroku clients:create NAME REDIRECT_URI`

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI [-j] [-s]

FLAGS
  -j, --json   output in json format
  -s, --shell  output in shell format

DESCRIPTION
  create a new OAuth client

EXAMPLES
  $ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/create.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/create.ts)_

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID

DESCRIPTION
  delete client by ID
```

_See code: [src/commands/clients/destroy.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/destroy.ts)_

## `heroku clients:info ID`

show details of an oauth client

```
USAGE
  $ heroku clients:info ID [-j] [-s]

FLAGS
  -j, --json   output in json format
  -s, --shell  output in shell format

DESCRIPTION
  show details of an oauth client

EXAMPLES
  $ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946
```

_See code: [src/commands/clients/info.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/info.ts)_

## `heroku clients:rotate ID`

rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate ID [-j] [-s]

FLAGS
  -j, --json   output in json format
  -s, --shell  output in shell format

DESCRIPTION
  rotate OAuth client secret
```

_See code: [src/commands/clients/rotate.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/rotate.ts)_

## `heroku clients:update ID`

update OAuth client

```
USAGE
  $ heroku clients:update ID [-n <value>] [--url <value>]

FLAGS
  -n, --name=<value>  change the client name
  --url=<value>       change the client redirect URL

DESCRIPTION
  update OAuth client

EXAMPLES
  $ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/update.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/clients/update.ts)_

## `heroku sessions`

list your OAuth sessions

```
USAGE
  $ heroku sessions [-j]

FLAGS
  -j, --json  output in json format

DESCRIPTION
  list your OAuth sessions
```

_See code: [src/commands/sessions/index.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/sessions/index.ts)_

## `heroku sessions:destroy ID`

delete (logout) OAuth session by ID

```
USAGE
  $ heroku sessions:destroy ID

DESCRIPTION
  delete (logout) OAuth session by ID
```

_See code: [src/commands/sessions/destroy.ts](https://github.com/heroku/cli/blob/v8.1.8/src/commands/sessions/destroy.ts)_
<!-- commandsstop -->
