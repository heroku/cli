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
$ heroku (-v|--version|version)
@heroku-cli/plugin-oauth/7.34.0 darwin-x64 node-v12.12.0
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
* [`heroku help [COMMAND]`](#heroku-help-command)
* [`heroku sessions`](#heroku-sessions)
* [`heroku sessions:destroy ID`](#heroku-sessionsdestroy-id)

## `heroku authorizations`

list OAuth authorizations

```
USAGE
  $ heroku authorizations

OPTIONS
  -j, --json  output in json format

EXAMPLE
  $ heroku authorizations
```

_See code: [src/commands/authorizations/index.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/index.ts)_

## `heroku authorizations:create`

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create

OPTIONS
  -S, --short                    only output token
  -d, --description=description  set a custom authorization
  -e, --expires-in=expires-in    set expiration in seconds (default no expiration)
  -j, --json                     output in json format
  -s, --scope=scope              set custom OAuth scopes

EXAMPLE
  $ heroku authorizations:create --description "For use with Anvil"
```

_See code: [src/commands/authorizations/create.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/create.ts)_

## `heroku authorizations:info ID`

show an existing OAuth authorization

```
USAGE
  $ heroku authorizations:info ID

OPTIONS
  -j, --json  output in json format
```

_See code: [src/commands/authorizations/info.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/info.ts)_

## `heroku authorizations:revoke ID`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke ID

EXAMPLE
  $ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
```

_See code: [src/commands/authorizations/revoke.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/revoke.ts)_

## `heroku authorizations:rotate ID`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate ID
```

_See code: [src/commands/authorizations/rotate.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/rotate.ts)_

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

_See code: [src/commands/authorizations/update.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/authorizations/update.ts)_

## `heroku clients`

list your OAuth clients

```
USAGE
  $ heroku clients

OPTIONS
  -j, --json  output in json format
```

_See code: [src/commands/clients/index.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/index.ts)_

## `heroku clients:create NAME REDIRECT_URI`

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format

EXAMPLE
  $ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/create.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/create.ts)_

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID
```

_See code: [src/commands/clients/destroy.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/destroy.ts)_

## `heroku clients:info ID`

show details of an oauth client

```
USAGE
  $ heroku clients:info ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format

EXAMPLE
  $ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946
```

_See code: [src/commands/clients/info.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/info.ts)_

## `heroku clients:rotate ID`

rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

_See code: [src/commands/clients/rotate.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/rotate.ts)_

## `heroku clients:update ID`

update OAuth client

```
USAGE
  $ heroku clients:update ID

OPTIONS
  -n, --name=name  change the client name
  --url=url        change the client redirect URL

EXAMPLE
  $ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url 
  https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/update.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/clients/update.ts)_

## `heroku help [COMMAND]`

display help for heroku

```
USAGE
  $ heroku help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `heroku sessions`

list your OAuth sessions

```
USAGE
  $ heroku sessions

OPTIONS
  -j, --json  output in json format
```

_See code: [src/commands/sessions/index.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/sessions/index.ts)_

## `heroku sessions:destroy ID`

delete (logout) OAuth session by ID

```
USAGE
  $ heroku sessions:destroy ID
```

_See code: [src/commands/sessions/destroy.ts](https://github.com/heroku/cli/blob/v7.34.0/src/commands/sessions/destroy.ts)_
<!-- commandsstop -->
