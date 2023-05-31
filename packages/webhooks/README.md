webhooks
========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/webhooks.svg)](https://npmjs.org/package/webhooks)
[![CircleCI](https://circleci.com/gh/chadian/webhooks/tree/master.svg?style=shield)](https://circleci.com/gh/chadian/webhooks/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/chadian/webhooks?branch=master&svg=true)](https://ci.appveyor.com/project/chadian/webhooks/branch/master)
[![Downloads/week](https://img.shields.io/npm/dw/webhooks.svg)](https://npmjs.org/package/webhooks)
[![License](https://img.shields.io/npm/l/webhooks.svg)](https://github.com/chadian/webhooks/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-webhooks
$ heroku COMMAND
running command...
$ heroku (--version|-v)
@heroku-cli/plugin-webhooks/8.1.6 darwin-x64 node-v16.19.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`heroku webhooks`](#heroku-webhooks)
* [`heroku webhooks:add`](#heroku-webhooksadd)
* [`heroku webhooks:deliveries`](#heroku-webhooksdeliveries)
* [`heroku webhooks:deliveries:info ID`](#heroku-webhooksdeliveriesinfo-id)
* [`heroku webhooks:events`](#heroku-webhooksevents)
* [`heroku webhooks:events:info ID`](#heroku-webhookseventsinfo-id)
* [`heroku webhooks:info ID`](#heroku-webhooksinfo-id)
* [`heroku webhooks:remove ID`](#heroku-webhooksremove-id)
* [`heroku webhooks:update ID`](#heroku-webhooksupdate-id)

## `heroku webhooks`

list webhooks on an app

```
USAGE
  $ heroku webhooks [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  list webhooks on an app

EXAMPLES
  $ heroku webhooks
```

_See code: [src/commands/webhooks/index.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/index.ts)_

## `heroku webhooks:add`

add a webhook to an app

```
USAGE
  $ heroku webhooks:add -i <value> -l <value> -u <value> [-a <value>] [-r <value>] [-s <value>] [-t <value>]

FLAGS
  -a, --app=<value>            app to run command against
  -i, --include=<value>        (required) comma delimited event types your server will receive
  -l, --level=<value>          (required) notify does not retry, sync will retry until successful or timeout
  -r, --remote=<value>         git remote of app to use
  -s, --secret=<value>         value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=<value>  authoriation header to send with webhooks
  -u, --url=<value>            (required) URL for receiver

DESCRIPTION
  add a webhook to an app

EXAMPLES
  $ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks
```

_See code: [src/commands/webhooks/add.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/add.ts)_

## `heroku webhooks:deliveries`

list webhook deliveries on an app

```
USAGE
  $ heroku webhooks:deliveries [-a <value>] [-r <value>] [-s <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --status=<value>  filter deliveries by status

DESCRIPTION
  list webhook deliveries on an app

EXAMPLES
  $ heroku webhooks:deliveries
```

_See code: [src/commands/webhooks/deliveries/index.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/deliveries/index.ts)_

## `heroku webhooks:deliveries:info ID`

info for a webhook event on an app

```
USAGE
  $ heroku webhooks:deliveries:info ID [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  info for a webhook event on an app

EXAMPLES
  $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
```

_See code: [src/commands/webhooks/deliveries/info.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/deliveries/info.ts)_

## `heroku webhooks:events`

list webhook events on an app

```
USAGE
  $ heroku webhooks:events [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  list webhook events on an app

EXAMPLES
  $ heroku webhooks:events
```

_See code: [src/commands/webhooks/events/index.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/events/index.ts)_

## `heroku webhooks:events:info ID`

info for a webhook event on an app

```
USAGE
  $ heroku webhooks:events:info ID [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  info for a webhook event on an app

EXAMPLES
  $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
```

_See code: [src/commands/webhooks/events/info.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/events/info.ts)_

## `heroku webhooks:info ID`

info for a webhook on an app

```
USAGE
  $ heroku webhooks:info ID [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  info for a webhook on an app

EXAMPLES
  $ heroku webhooks:info 99999999-9999-9999-9999-999999999999
```

_See code: [src/commands/webhooks/info.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/info.ts)_

## `heroku webhooks:remove ID`

removes a webhook from an app

```
USAGE
  $ heroku webhooks:remove ID [-a <value>] [-r <value>]

ARGUMENTS
  ID  id of webhook to remove

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  removes a webhook from an app

EXAMPLES
  $ heroku webhooks:remove 99999999-9999-9999-9999-999999999999
```

_See code: [src/commands/webhooks/remove.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/remove.ts)_

## `heroku webhooks:update ID`

updates a webhook in an app

```
USAGE
  $ heroku webhooks:update ID -i <value> -l <value> -u <value> [-a <value>] [-r <value>] [-s <value>] [-t <value>]

FLAGS
  -a, --app=<value>            app to run command against
  -i, --include=<value>        (required) comma delimited event types your server will receive
  -l, --level=<value>          (required) notify does not retry, sync will retry until successful or timeout
  -r, --remote=<value>         git remote of app to use
  -s, --secret=<value>         value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=<value>  authoriation header to send with webhooks
  -u, --url=<value>            (required) URL for receiver

DESCRIPTION
  updates a webhook in an app

EXAMPLES
  $ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
```

_See code: [src/commands/webhooks/update.ts](https://github.com/heroku/cli/blob/v8.1.6/src/commands/webhooks/update.ts)_
<!-- commandsstop -->
