`heroku telemetry`
==================

list telemetry drains

* [`heroku telemetry`](#heroku-telemetry)
* [`heroku telemetry:add ENDPOINT`](#heroku-telemetryadd-endpoint)
* [`heroku telemetry:info TELEMETRY_DRAIN_ID`](#heroku-telemetryinfo-telemetry_drain_id)
* [`heroku telemetry:remove [TELEMETRY_DRAIN_ID]`](#heroku-telemetryremove-telemetry_drain_id)
* [`heroku telemetry:update TELEMETRY_DRAIN_ID`](#heroku-telemetryupdate-telemetry_drain_id)

## `heroku telemetry`

list telemetry drains

```
USAGE
  $ heroku telemetry [-s <value>] [-a <value>]

FLAGS
  -a, --app=<value>    filter by app name
  -s, --space=<value>  filter by space name

DESCRIPTION
  list telemetry drains

EXAMPLES
  $ heroku telemetry
```

_See code: [src/commands/telemetry/index.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/telemetry/index.ts)_

## `heroku telemetry:add ENDPOINT`

Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.

```
USAGE
  $ heroku telemetry:add ENDPOINT [-a <value>] [--headers <value>] [-s <value>] [--signals <value>] [--transport
    http|grpc]

ARGUMENTS
  ENDPOINT  drain url

FLAGS
  -a, --app=<value>         app to add a drain to
  -s, --space=<value>       space to add a drain to
      --headers=<value>     custom headers to configure the drain in json format
      --signals=<value>     [default: all] comma-delimited list of signals to collect (traces, metrics, logs). Use "all"
                            to collect all signals.
      --transport=<option>  [default: http] transport protocol for the drain
                            <options: http|grpc>

DESCRIPTION
  Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.

EXAMPLES
  Add a telemetry drain to an app to collect logs and traces:

    $ heroku telemetry:add https://my-endpoint.com --app myapp --signals logs,traces --headers \
      '{"x-drain-example-team": "API_KEY", "x-drain-example-dataset": "METRICS_DATASET"}'
```

_See code: [src/commands/telemetry/add.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/telemetry/add.ts)_

## `heroku telemetry:info TELEMETRY_DRAIN_ID`

show a telemetry drain's info

```
USAGE
  $ heroku telemetry:info TELEMETRY_DRAIN_ID

ARGUMENTS
  TELEMETRY_DRAIN_ID  ID of the drain to show info for

DESCRIPTION
  show a telemetry drain's info

EXAMPLES
  $ heroku telemetry:info 022e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e
```

_See code: [src/commands/telemetry/info.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/telemetry/info.ts)_

## `heroku telemetry:remove [TELEMETRY_DRAIN_ID]`

remove a telemetry drain

```
USAGE
  $ heroku telemetry:remove [TELEMETRY_DRAIN_ID] [-a <value>] [-s <value>]

ARGUMENTS
  TELEMETRY_DRAIN_ID  ID of the drain to remove

FLAGS
  -a, --app=<value>    name of the app to remove all drains from
  -s, --space=<value>  name of the space to remove all drains from

DESCRIPTION
  remove a telemetry drain
```

_See code: [src/commands/telemetry/remove.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/telemetry/remove.ts)_

## `heroku telemetry:update TELEMETRY_DRAIN_ID`

updates a telemetry drain with provided attributes (attributes not provided remain unchanged)

```
USAGE
  $ heroku telemetry:update TELEMETRY_DRAIN_ID [--endpoint <value>] [--headers <value>] [--signals <value>]
    [--transport http|grpc]

ARGUMENTS
  TELEMETRY_DRAIN_ID  ID of the drain to update

FLAGS
  --endpoint=<value>    drain url
  --headers=<value>     custom headers to configure the drain in json format
  --signals=<value>     comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all
                        signals.
  --transport=<option>  transport protocol for the drain
                        <options: http|grpc>

DESCRIPTION
  updates a telemetry drain with provided attributes (attributes not provided remain unchanged)

EXAMPLES
  $ heroku telemetry:update acde070d-8c4c-4f0d-9d8a-162843c10333 --signals logs,metrics --endpoint https://my-new-endpoint.com
```

_See code: [src/commands/telemetry/update.ts](https://github.com/heroku/cli/blob/v10.0.1-beta.1/packages/cli/src/commands/telemetry/update.ts)_
