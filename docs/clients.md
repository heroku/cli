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
  $ heroku clients

OPTIONS
  -j, --json  output in json format
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/index.js)_

## `heroku clients:create NAME REDIRECT_URI`

create a new OAuth client

```
USAGE
  $ heroku clients:create NAME REDIRECT_URI

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/create.js)_

## `heroku clients:destroy ID`

delete client by ID

```
USAGE
  $ heroku clients:destroy ID
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/destroy.js)_

## `heroku clients:info ID`

show details of an oauth client

```
USAGE
  $ heroku clients:info ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/info.js)_

## `heroku clients:rotate ID`

rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate ID

OPTIONS
  -j, --json   output in json format
  -s, --shell  output in shell format
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/rotate.js)_

## `heroku clients:update ID`

update OAuth client

```
USAGE
  $ heroku clients:update ID

OPTIONS
  -n, --name=name  change the client name
  --url=url        change the client redirect URL
```

_See code: [@heroku-cli/plugin-oauth-v5](https://github.com/heroku/cli/blob/v7.24.0/packages/oauth-v5/lib/commands/clients/update.js)_
