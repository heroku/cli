# heroku-webhooks

<!-- commands -->
# Commands

* [@heroku-cli/plugin-webhooks webhooks](#webhooks)
* [@heroku-cli/plugin-webhooks webhooks:add](#webhooksadd)
* [@heroku-cli/plugin-webhooks webhooks:deliveries](#webhooksdeliveries)
* [@heroku-cli/plugin-webhooks webhooks:deliveries:info [ID]](#webhooksdeliveriesinfo-id)
* [@heroku-cli/plugin-webhooks webhooks:events](#webhooksevents)
* [@heroku-cli/plugin-webhooks webhooks:events:info [ID]](#webhookseventsinfo-id)
* [@heroku-cli/plugin-webhooks webhooks:info [ID]](#webhooksinfo-id)
* [@heroku-cli/plugin-webhooks webhooks:remove [ID]](#webhooksremove-id)
* [@heroku-cli/plugin-webhooks webhooks:update [ID]](#webhooksupdate-id)
## webhooks

list webhooks on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks
```

_See code: [commands/webhooks.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks.js)_

### webhooks:add

add a webhook to an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:add

OPTIONS
  -a, --app=app                      app to run command against
  -i, --include=include              (required) comma delimited event types your server will receive
  -l, --level=level                  (required) notify does not retry, sync will retry until successful or timeout
  -s, --secret=secret                value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=authorization  authoriation header to send with webhooks
  -u, --url=url                      (required) URL for receiver

EXAMPLE
  $ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks
```

_See code: [commands/webhooks/add.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/add.js)_

### webhooks:deliveries

list webhook deliveries on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries

OPTIONS
  -a, --app=app        app to run command against
  -s, --status=status  filter deliveries by status

EXAMPLE
  $ heroku webhooks:deliveries
```

_See code: [commands/webhooks/deliveries.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries.js)_

#### webhooks:deliveries:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/deliveries/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries/info.js)_

### webhooks:deliveries:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/deliveries/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries/info.js)_

### webhooks:events

list webhook events on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events
```

_See code: [commands/webhooks/events.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events.js)_

#### webhooks:events:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/events/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events/info.js)_

### webhooks:events:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/events/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events/info.js)_

### webhooks:info [ID]

info for a webhook on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/info.js)_

### webhooks:remove [ID]

removes a webhook from an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:remove [ID]

ARGUMENTS
  ID  id of webhook to remove

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:remove 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/remove.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/remove.js)_

### webhooks:update [ID]

updates a webhook in an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:update [ID]

OPTIONS
  -a, --app=app                      app to run command against
  -i, --include=include              (required) comma delimited event types your server will receive
  -l, --level=level                  (required) notify does not retry, sync will retry until successful or timeout
  -s, --secret=secret                value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=authorization  authoriation header to send with webhooks
  -u, --url=url                      (required) URL for receiver

EXAMPLE
  $ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 
  09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
```

_See code: [commands/webhooks/update.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/update.js)_

## webhooks:add

add a webhook to an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:add

OPTIONS
  -a, --app=app                      app to run command against
  -i, --include=include              (required) comma delimited event types your server will receive
  -l, --level=level                  (required) notify does not retry, sync will retry until successful or timeout
  -s, --secret=secret                value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=authorization  authoriation header to send with webhooks
  -u, --url=url                      (required) URL for receiver

EXAMPLE
  $ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks
```

_See code: [commands/webhooks/add.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/add.js)_

## webhooks:deliveries

list webhook deliveries on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries

OPTIONS
  -a, --app=app        app to run command against
  -s, --status=status  filter deliveries by status

EXAMPLE
  $ heroku webhooks:deliveries
```

_See code: [commands/webhooks/deliveries.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries.js)_

### webhooks:deliveries:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/deliveries/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries/info.js)_

## webhooks:deliveries:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:deliveries:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/deliveries/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/deliveries/info.js)_

## webhooks:events

list webhook events on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events
```

_See code: [commands/webhooks/events.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events.js)_

### webhooks:events:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/events/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events/info.js)_

## webhooks:events:info [ID]

info for a webhook event on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:events:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/events/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/events/info.js)_

## webhooks:info [ID]

info for a webhook on an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:info [ID]

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:info 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/info.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/info.js)_

## webhooks:remove [ID]

removes a webhook from an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:remove [ID]

ARGUMENTS
  ID  id of webhook to remove

OPTIONS
  -a, --app=app  app to run command against

EXAMPLE
  $ heroku webhooks:remove 99999999-9999-9999-9999-999999999999
```

_See code: [commands/webhooks/remove.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/remove.js)_

## webhooks:update [ID]

updates a webhook in an app

```
USAGE
  $ @heroku-cli/plugin-webhooks webhooks:update [ID]

OPTIONS
  -a, --app=app                      app to run command against
  -i, --include=include              (required) comma delimited event types your server will receive
  -l, --level=level                  (required) notify does not retry, sync will retry until successful or timeout
  -s, --secret=secret                value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header
  -t, --authorization=authorization  authoriation header to send with webhooks
  -u, --url=url                      (required) URL for receiver

EXAMPLE
  $ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 
  09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
```

_See code: [commands/webhooks/update.js](https://github.com/heroku/heroku-webhooks/blob/v1.2.0/commands/webhooks/update.js)_
<!-- commandsstop -->
