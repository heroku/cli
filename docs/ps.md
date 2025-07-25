`heroku ps`
===========

Client tools for Heroku Exec

* [`heroku ps [TYPE [TYPE ...]]`](#heroku-ps-type-type-)
* [`heroku ps:autoscale:disable`](#heroku-psautoscaledisable)
* [`heroku ps:autoscale:enable`](#heroku-psautoscaleenable)
* [`heroku ps:copy FILE`](#heroku-pscopy-file)
* [`heroku ps:exec`](#heroku-psexec)
* [`heroku ps:forward PORT`](#heroku-psforward-port)
* [`heroku ps:kill [DYNO]`](#heroku-pskill-dyno)
* [`heroku ps:resize`](#heroku-psresize)
* [`heroku ps:restart [DYNO]`](#heroku-psrestart-dyno)
* [`heroku ps:scale`](#heroku-psscale)
* [`heroku ps:socks`](#heroku-pssocks)
* [`heroku ps:stop [DYNO]`](#heroku-psstop-dyno)
* [`heroku ps:type`](#heroku-pstype)
* [`heroku ps:wait`](#heroku-pswait)

## `heroku ps [TYPE [TYPE ...]]`

list dynos for an app

```
USAGE
  $ heroku ps [TYPE [TYPE ...]]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --json            display as json

DESCRIPTION
  list dynos for an app

EXAMPLES
  $ heroku ps
  === run: one-off dyno
  run.1: up for 5m: bash
  === web: bundle exec thin start -p $PORT
  web.1: created for 30s

  $ heroku ps run # specifying types
  === run: one-off dyno
  run.1: up for 5m: bash
```

_See code: [src/commands/ps/index.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/index.ts)_

## `heroku ps:autoscale:disable`

disable web dyno autoscaling

```
USAGE
  $ heroku ps:autoscale:disable -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disable web dyno autoscaling
```

_See code: [src/commands/ps/autoscale/disable.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/autoscale/disable.ts)_

## `heroku ps:autoscale:enable`

enable web dyno autoscaling

```
USAGE
  $ heroku ps:autoscale:enable -a <value> --min <value> --max <value> [-r <value>] [--p95 <value>] [--notifications]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
      --max=<value>     (required) maximum number of dynos
      --min=<value>     (required) minimum number of dynos
      --notifications   receive email notifications when the max dyno limit is reached
      --p95=<value>     desired p95 response time

DESCRIPTION
  enable web dyno autoscaling
```

_See code: [src/commands/ps/autoscale/enable.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/autoscale/enable.ts)_

## `heroku ps:copy FILE`

Copy a file from a dyno to the local filesystem

```
USAGE
  $ heroku ps:copy FILE -a <value> [-d <value>] [-o <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -o, --output=<value>  the name of the output file
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Copy a file from a dyno to the local filesystem
  Example:

  $ heroku ps:copy FILENAME --app murmuring-headland-14719
```

## `heroku ps:exec`

Create an SSH session to a dyno

```
USAGE
  $ heroku ps:exec -a <value> [-d <value>] [--ssh] [--status] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use
      --ssh             use native ssh
      --status          lists the status of the SSH server in the dyno

DESCRIPTION
  Create an SSH session to a dyno
  Example:

  $ heroku ps:exec 'node -i' --app murmuring-headland-14719
```

## `heroku ps:forward PORT`

Forward traffic on a local port to a dyno

```
USAGE
  $ heroku ps:forward PORT -a <value> [-d <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Forward traffic on a local port to a dyno
  Provide a port or comma-separated list of ports to forward.

  For example, "4000,9000:9001" will forward port 4000 to port 4000 and
  port 9000 to port 9001.

  Example:

  $ heroku ps:forward 8080 --app murmuring-headland-14719
```

## `heroku ps:kill [DYNO]`

stop an app dyno or process type

```
USAGE
  $ heroku ps:kill [DYNO] -a <value> [-r <value>] [-p <value> | -d <value>]

ARGUMENTS
  DYNO  name of the dyno to stop

FLAGS
  -a, --app=<value>           (required) app to run command against
  -d, --dyno-name=<value>     name of the dyno to stop
  -p, --process-type=<value>  name of the process type to stop
  -r, --remote=<value>        git remote of app to use

DESCRIPTION
  stop an app dyno or process type

ALIASES
  $ heroku dyno:stop
  $ heroku ps:kill
  $ heroku dyno:kill

EXAMPLES
  $ heroku ps:stop --app myapp --dyno-name run.1828

  $ heroku ps:stop --app myapp --process-type run
```

## `heroku ps:resize`

manage dyno sizes

```
USAGE
  $ heroku ps:resize -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  manage dyno sizes
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.


ALIASES
  $ heroku ps:resize
  $ heroku dyno:resize
```

## `heroku ps:restart [DYNO]`

restart an app dyno or process type

```
USAGE
  $ heroku ps:restart [DYNO] -a <value> [-r <value>] [-p <value> | -d <value>]

ARGUMENTS
  DYNO  name of the dyno to restart

FLAGS
  -a, --app=<value>           (required) app to run command against
  -d, --dyno-name=<value>     name of the dyno to restart
  -p, --process-type=<value>  name of the process type to restart
  -r, --remote=<value>        git remote of app to use

DESCRIPTION
  restart an app dyno or process type
  if neither --dyno nor --type are specified, restarts all dynos on app


ALIASES
  $ heroku dyno:restart

EXAMPLES
  $ heroku ps:restart --app myapp --dyno-name web.1

  $ heroku ps:restart --app myapp --process-type web

  $ heroku ps:restart --app myapp
```

_See code: [src/commands/ps/restart.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/restart.ts)_

## `heroku ps:scale`

scale dyno quantity up or down

```
USAGE
  $ heroku ps:scale -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  scale dyno quantity up or down
  Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

  Omitting any arguments will display the app's current dyno formation, in a
  format suitable for passing back into ps:scale.


ALIASES
  $ heroku dyno:scale

EXAMPLES
  $ heroku ps:scale web=3:Standard-2X worker+1 --app APP
  Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

  $ heroku ps:scale --app APP
  web=3:Standard-2X worker=1:Standard-1X
```

_See code: [src/commands/ps/scale.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/scale.ts)_

## `heroku ps:socks`

Launch a SOCKS proxy into a dyno

```
USAGE
  $ heroku ps:socks -a <value> [-d <value>] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -d, --dyno=<value>    specify the dyno to connect to
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  Launch a SOCKS proxy into a dyno
  Example:

  $ heroku ps:socks --app murmuring-headland-14719
  Establishing credentials... done
  SOCKSv5 proxy server started on port 1080
  Use CTRL+C to stop the proxy
```

## `heroku ps:stop [DYNO]`

stop an app dyno or process type

```
USAGE
  $ heroku ps:stop [DYNO] -a <value> [-r <value>] [-p <value> | -d <value>]

ARGUMENTS
  DYNO  name of the dyno to stop

FLAGS
  -a, --app=<value>           (required) app to run command against
  -d, --dyno-name=<value>     name of the dyno to stop
  -p, --process-type=<value>  name of the process type to stop
  -r, --remote=<value>        git remote of app to use

DESCRIPTION
  stop an app dyno or process type

ALIASES
  $ heroku dyno:stop
  $ heroku ps:kill
  $ heroku dyno:kill

EXAMPLES
  $ heroku ps:stop --app myapp --dyno-name run.1828

  $ heroku ps:stop --app myapp --process-type run
```

_See code: [src/commands/ps/stop.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/stop.ts)_

## `heroku ps:type`

manage dyno sizes

```
USAGE
  $ heroku ps:type -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  manage dyno sizes
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.


ALIASES
  $ heroku ps:resize
  $ heroku dyno:resize
```

_See code: [src/commands/ps/type.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/type.ts)_

## `heroku ps:wait`

wait for all dynos to be running latest version after a release

```
USAGE
  $ heroku ps:wait -a <value> [-r <value>] [-w <value>] [-R | -t <value>]

FLAGS
  -R, --with-run               whether to wait for one-off run dynos
  -a, --app=<value>            (required) app to run command against
  -r, --remote=<value>         git remote of app to use
  -t, --type=<value>           wait for one specific dyno type
  -w, --wait-interval=<value>  [default: 10] how frequently to poll in seconds (to avoid hitting Heroku API rate limits)

DESCRIPTION
  wait for all dynos to be running latest version after a release
```

_See code: [src/commands/ps/wait.ts](https://github.com/heroku/cli/blob/v10.12.0/packages/cli/src/commands/ps/wait.ts)_
