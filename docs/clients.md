`heroku clients`
================

OAuth clients on the platform

* [`heroku clients`](#heroku-clients)
* [`heroku clients:create NAME REDIRECT_URI`](#heroku-clientscreate-name-redirect_uri)
* [`heroku clients:destroy ID`](#heroku-clientsdestroy-id)
* [`heroku clients:info ID`](#heroku-clientsinfo-id)
* [`heroku clients:rotate ID`](#heroku-clientsrotate-id)
* [`heroku clients:update ID`](#heroku-clientsupdate-id)

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

_See code: [src/commands/clients/index.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/index.ts)_

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

_See code: [src/commands/clients/create.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/create.ts)_

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID

DESCRIPTION
  delete client by ID
```

_See code: [src/commands/clients/destroy.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/destroy.ts)_

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

_See code: [src/commands/clients/info.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/info.ts)_

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

_See code: [src/commands/clients/rotate.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/rotate.ts)_

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

_See code: [src/commands/clients/update.ts](https://github.com/heroku/cli/blob/v8.2.0-beta.4/src/commands/clients/update.ts)_
