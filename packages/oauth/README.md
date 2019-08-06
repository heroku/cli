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
$ npm install -g oauth
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
oauth/8.0.0 darwin-x64 node-v10.16.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku clients`](#heroku-clients)
* [`heroku clients:create NAME REDIRECT_URI`](#heroku-clientscreate-name-redirect_uri)
* [`heroku clients:destroy ID`](#heroku-clientsdestroy-id)
* [`heroku clients:update ID`](#heroku-clientsupdate-id)
* [`heroku help [COMMAND]`](#heroku-help-command)

## `heroku clients`

list your OAuth clients

```
USAGE
  $ heroku clients

OPTIONS
  -h, --help  show CLI help
  -j, --json  output in json format
```

_See code: [src/commands/clients/index.ts](https://github.com/heroku/cli/blob/v8.0.0/src/commands/clients/index.ts)_

## `heroku clients:create NAME REDIRECT_URI`

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI

OPTIONS
  -h, --help   show CLI help
  -j, --json   output in json format
  -s, --shell  output in shell format

EXAMPLE
  $ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/create.ts](https://github.com/heroku/cli/blob/v8.0.0/src/commands/clients/create.ts)_

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID
```

_See code: [src/commands/clients/destroy.ts](https://github.com/heroku/cli/blob/v8.0.0/src/commands/clients/destroy.ts)_

## `heroku clients:update ID`

update OAuth client

```
USAGE
  $ heroku clients:update ID

OPTIONS
  -h, --help       show CLI help
  -n, --name=name  change the client name
  --url=url        change the client redirect URL

EXAMPLE
  $ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url 
  https://amazing-client.herokuapp.com/auth/heroku/callback
```

_See code: [src/commands/clients/update.ts](https://github.com/heroku/cli/blob/v8.0.0/src/commands/clients/update.ts)_

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
<!-- commandsstop -->
