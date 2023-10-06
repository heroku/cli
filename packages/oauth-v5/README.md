# Heroku OAuth [![CircleCI](https://circleci.com/gh/heroku/heroku-cli-oauth.svg?style=svg)](https://circleci.com/gh/heroku/heroku-cli-oauth)
[![Code Climate](https://codeclimate.com/github/heroku/heroku-cli-oauth/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-cli-oauth)
[![npm version](https://badge.fury.io/js/heroku-cli-oauth.svg)](https://badge.fury.io/js/heroku-cli-oauth)
[![License](https://img.shields.io/github/license/heroku/heroku-cli-oauth.svg)](https://github.com/heroku/heroku-cli-oauth/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Command line plugin for managing OAuth clients, authorizations and tokens.

No need to install, this plugin comes built into the Heroku CLI.

### Clients

To create a client:

``` bash
$ heroku clients:create "Amazing" https://amazing-client.herokuapp.com/auth/heroku/callback
Creating Amazing... done
HEROKU_OAUTH_ID=3e304bda-d376-4278-bdea-6d6c08aa1359
HEROKU_OAUTH_SECRET=e6a5f58f-f8a9-49f1-a1a6-d1dd98930ef6
```

See OAuth clients under your account with:

``` bash
$ heroku clients
Amazing  3e304bda-d376-4278-bdea-6d6c08aa1359  https://amazing-client.herokuapp.com/auth/heroku/callback
```

Get details about a client:
```bash
$ heroku clients:info 36120128-fee7-455e-8b7f-807aee130946
=== Amazing
created_at:         2016-01-21T02:11:57Z
id:                 36120128-fee7-455e-8b7f-807aee130946
name:               Amazing
redirect_uri:       https://amazing-client.herokuapp.com/auth/heroku/callback
secret:             a14cf558-60b8-44f2-a804-3b249b48aa57
updated_at:         2016-01-21T02:11:57Z
```

Update clients:

``` bash
$ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url https://amazing-client.herokuapp.com/auth/heroku/callback
Updated Amazing... done
```

### Authorizations

List them:

``` bash
$ heroku authorizations
Amazing                        9e3a4063-b833-432e-ad75-4b0d7195be13  global
Heroku CLI                     676cb46c-7597-4be1-8a6a-f87b9f2f1065  global
```

#### Creating

You can create a special user-created authorization against your account that will come with an access token which doesn't expire:

``` bash
$ heroku authorizations:create --description "For use with Anvil"
Created OAuth authorization.
  ID:          105a7bfa-34c3-476e-873a-b1ac3fdc12fb
  Description: For use with Anvil
  Token:       4cee516c-f8c6-4f14-9edf-fc6ef09cedc5
  Scope:       global
```

You can also pass in short output format to only output the token.

```bash
$ heroku authorizations:create --output-format short
nec6a9b6-b21a-4ba1-il95-70zd47e14c4d
```

Another option allows for tokens that expire.  This token expires in 10 seconds.
```
$ heroku authorizations:create --expires-in 10
Created OAuth authorization.
  Client:      <none>
  ID:          2231biha6-5b1e-4268-ba04-2ee7b74m2gf6
  Description: Long-lived user authorization
  Scope:       global
  Token:       9aa5d667-fg37-4028-8dc9-b2191b5z5966
```

A combination of short format and expires-in can be handy to pass into a job that needs access to heroku:

``` bash
$ heroku run "HEROKU_EMAIL=`heroku auth:whoami` HEROKU_API_KEY=`heroku authorizations:create --expires-in 120 --output-format short` ./my_job.sh" -a myapp
```


Optionally, you can specify a list of scopes for the authorization:

``` bash
$ heroku authorizations:create --description "For use with Anvil" --scope identity,read-protected
Created OAuth authorization.
  ID:          105a7bfa-34c3-476e-873a-b1ac3fdc12fb
  Description: For use with Anvil
  Token:       4cee516c-f8c6-4f14-9edf-fc6ef09cedc5
  Scope:       identity, read-protected
```

The procured token can now be used like an API key:

``` bash
$ curl -u ":4cee516c-f8c6-4f14-9edf-fc6ef09cedc5" https://api.heroku.com/apps
```


#### Revoking

Any authorization on your account can be revoked at any time:

``` bash
$ heroku authorizations:revoke 105a7bfa-34c3-476e-873a-b1ac3fdc12fb
Revoked authorization from "Another App".
```
<!-- commands -->
* [`heroku authorizations`](#heroku-authorizations)
* [`heroku authorizations:create`](#heroku-authorizationscreate)
* [`heroku authorizations:destroy [ID]`](#heroku-authorizationsdestroy-id)
* [`heroku authorizations:info [ID]`](#heroku-authorizationsinfo-id)
* [`heroku authorizations:revoke [ID]`](#heroku-authorizationsrevoke-id)
* [`heroku authorizations:rotate [ID]`](#heroku-authorizationsrotate-id)
* [`heroku authorizations:update [ID]`](#heroku-authorizationsupdate-id)
* [`heroku clients`](#heroku-clients)
* [`heroku clients:create [NAME] [REDIRECT_URI]`](#heroku-clientscreate-name-redirect_uri)
* [`heroku clients:destroy [ID]`](#heroku-clientsdestroy-id)
* [`heroku clients:info [ID]`](#heroku-clientsinfo-id)
* [`heroku clients:rotate [ID]`](#heroku-clientsrotate-id)
* [`heroku clients:update [ID]`](#heroku-clientsupdate-id)
* [`heroku sessions`](#heroku-sessions)
* [`heroku sessions:destroy [ID]`](#heroku-sessionsdestroy-id)

## `heroku authorizations`

list OAuth authorizations

```
USAGE
  $ heroku authorizations [-j]

FLAGS
  -j, --0  output in json format

DESCRIPTION
  list OAuth authorizations
```

_See code: [lib/commands/authorizations/index.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/index.js)_

## `heroku authorizations:create`

create a new OAuth authorization

```
USAGE
  $ heroku authorizations:create [-d] [-s] [-e] [-S] [-j]

FLAGS
  -S, --3  only output token
  -d, --0  set a custom authorization description
  -e, --2  set expiration in seconds (default no expiration)
  -j, --4  output in json format
  -s, --1  set custom OAuth scopes

DESCRIPTION
  create a new OAuth authorization
```

_See code: [lib/commands/authorizations/create.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/create.js)_

## `heroku authorizations:destroy [ID]`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:destroy [ID]

DESCRIPTION
  revoke OAuth authorization

ALIASES
  $ heroku authorizations:destroy
  $ heroku authorizations:revoke
```

## `heroku authorizations:info [ID]`

show an existing OAuth authorization

```
USAGE
  $ heroku authorizations:info [ID] [-j]

FLAGS
  -j, --0  output in json format

DESCRIPTION
  show an existing OAuth authorization
```

_See code: [lib/commands/authorizations/info.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/info.js)_

## `heroku authorizations:revoke [ID]`

revoke OAuth authorization

```
USAGE
  $ heroku authorizations:revoke [ID]

DESCRIPTION
  revoke OAuth authorization

ALIASES
  $ heroku authorizations:destroy
  $ heroku authorizations:revoke
```

_See code: [lib/commands/authorizations/revoke.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/revoke.js)_

## `heroku authorizations:rotate [ID]`

updates an OAuth authorization token

```
USAGE
  $ heroku authorizations:rotate [ID]

DESCRIPTION
  updates an OAuth authorization token
```

_See code: [lib/commands/authorizations/rotate.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/rotate.js)_

## `heroku authorizations:update [ID]`

updates an OAuth authorization

```
USAGE
  $ heroku authorizations:update [ID] [-d] [--1] [--2]

FLAGS
  -d, --0  set a custom authorization description
  --1      identifier of OAuth client to set
  --2      secret of OAuth client to set

DESCRIPTION
  updates an OAuth authorization
```

_See code: [lib/commands/authorizations/update.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/authorizations/update.js)_

## `heroku clients`

list your OAuth clients

```
USAGE
  $ heroku clients [-j]

FLAGS
  -j, --0  output in json format

DESCRIPTION
  list your OAuth clients
```

_See code: [lib/commands/clients/index.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/index.js)_

## `heroku clients:create [NAME] [REDIRECT_URI]`

create a new OAuth client

```
USAGE
  $ heroku clients:create [NAME] [REDIRECT_URI] [-s] [-j]

FLAGS
  -j, --1  output in json format
  -s, --0  output in shell format

DESCRIPTION
  create a new OAuth client
```

_See code: [lib/commands/clients/create.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/create.js)_

## `heroku clients:destroy [ID]`

delete client by ID

```
USAGE
  $ heroku clients:destroy [ID]

DESCRIPTION
  delete client by ID
```

_See code: [lib/commands/clients/destroy.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/destroy.js)_

## `heroku clients:info [ID]`

show details of an oauth client

```
USAGE
  $ heroku clients:info [ID] [-j] [-s]

FLAGS
  -j, --0  output in json format
  -s, --1  output in shell format

DESCRIPTION
  show details of an oauth client
```

_See code: [lib/commands/clients/info.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/info.js)_

## `heroku clients:rotate [ID]`

rotate OAuth client secret

```
USAGE
  $ heroku clients:rotate [ID] [-j] [-s]

FLAGS
  -j, --0  output in json format
  -s, --1  output in shell format

DESCRIPTION
  rotate OAuth client secret
```

_See code: [lib/commands/clients/rotate.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/rotate.js)_

## `heroku clients:update [ID]`

update OAuth client

```
USAGE
  $ heroku clients:update [ID] [-n] [--1]

FLAGS
  -n, --0  change the client name
  --1      change the client redirect URL

DESCRIPTION
  update OAuth client
```

_See code: [lib/commands/clients/update.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/clients/update.js)_

## `heroku sessions`

list your OAuth sessions

```
USAGE
  $ heroku sessions [-j]

FLAGS
  -j, --0  output in json format

DESCRIPTION
  list your OAuth sessions
```

_See code: [lib/commands/sessions/index.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/sessions/index.js)_

## `heroku sessions:destroy [ID]`

delete (logout) OAuth session by ID

```
USAGE
  $ heroku sessions:destroy [ID]

DESCRIPTION
  delete (logout) OAuth session by ID
```

_See code: [lib/commands/sessions/destroy.js](https://github.com/heroku/cli/blob/v8.6.0-beta.0/packages/oauth-v5/lib/commands/sessions/destroy.js)_
<!-- commandsstop -->
