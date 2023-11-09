# heroku-apps [![Circle CI](https://circleci.com/gh/heroku/heroku-apps.svg?style=svg)](https://circleci.com/gh/heroku/heroku-apps)

[![Code Climate](https://codeclimate.com/github/heroku/heroku-apps/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-apps)
[![npm version](https://badge.fury.io/js/heroku-apps.svg)](https://badge.fury.io/js/heroku-apps)
[![License](https://img.shields.io/github/license/heroku/heroku-apps.svg)](https://github.com/heroku/heroku-apps/blob/master/LICENSE)
[![Greenkeeper badge](https://badges.greenkeeper.io/heroku/heroku-apps.svg)](https://greenkeeper.io/)

This core plugin comes preinstalled to the [Heroku CLI](https://cli.heroku.com).

<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-apps-v5
$ heroku COMMAND
running command...
$ heroku (--version)
@heroku-cli/plugin-apps-v5/9.0.0-alpha.1 darwin-arm64 node-v16.19.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`heroku dyno:kill DYNO`](#heroku-dynokill-dyno)
* [`heroku dyno:resize`](#heroku-dynoresize)
* [`heroku dyno:restart [DYNO]`](#heroku-dynorestart-dyno)
* [`heroku dyno:scale`](#heroku-dynoscale)
* [`heroku dyno:stop DYNO`](#heroku-dynostop-dyno)
* [`heroku features`](#heroku-features)
* [`heroku features:disable FEATURE`](#heroku-featuresdisable-feature)
* [`heroku features:enable FEATURE`](#heroku-featuresenable-feature)
* [`heroku features:info FEATURE`](#heroku-featuresinfo-feature)
* [`heroku keys`](#heroku-keys)
* [`heroku keys:add [KEY]`](#heroku-keysadd-key)
* [`heroku keys:clear`](#heroku-keysclear)
* [`heroku keys:remove KEY`](#heroku-keysremove-key)
* [`heroku labs`](#heroku-labs)
* [`heroku labs:enable FEATURE`](#heroku-labsenable-feature)
* [`heroku labs:info FEATURE`](#heroku-labsinfo-feature)
* [`heroku maintenance`](#heroku-maintenance)
* [`heroku maintenance:off`](#heroku-maintenanceoff)
* [`heroku maintenance:on`](#heroku-maintenanceon)
* [`heroku notifications`](#heroku-notifications)
* [`heroku ps [TYPE [TYPE ...]]`](#heroku-ps-type-type-)
* [`heroku ps:kill DYNO`](#heroku-pskill-dyno)
* [`heroku ps:resize`](#heroku-psresize)
* [`heroku ps:restart [DYNO]`](#heroku-psrestart-dyno)
* [`heroku ps:scale`](#heroku-psscale)
* [`heroku ps:stop DYNO`](#heroku-psstop-dyno)
* [`heroku ps:type`](#heroku-pstype)
* [`heroku releases`](#heroku-releases)
* [`heroku releases:info [RELEASE]`](#heroku-releasesinfo-release)
* [`heroku releases:output [RELEASE]`](#heroku-releasesoutput-release)
* [`heroku releases:rollback [RELEASE]`](#heroku-releasesrollback-release)

## `heroku dyno:kill DYNO`

stop app dyno

```
USAGE
  $ heroku dyno:kill DYNO -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  stop app dyno

  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done
  $ heroku ps:stop run
  Stopping run dynos... done
```

## `heroku dyno:resize`

manage dyno sizes

```
USAGE
  $ heroku dyno:resize -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  manage dyno sizes

  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## `heroku dyno:restart [DYNO]`

restart app dynos

```
USAGE
  $ heroku dyno:restart [DYNO] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  restart app dynos
  if DYNO is not specified, restarts all dynos on app

EXAMPLES
  $ heroku ps:restart web.1
  Restarting web.1 dyno... done
  $ heroku ps:restart web
  Restarting web dynos... done
  $ heroku ps:restart
  Restarting dynos... done
```

## `heroku dyno:scale`

scale dyno quantity up or down

```
USAGE
  $ heroku dyno:scale -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  scale dyno quantity up or down
  Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

  Omitting any arguments will display the app's current dyno formation, in a
  format suitable for passing back into ps:scale.

EXAMPLES
  $ heroku ps:scale web=3:Standard-2X worker+1
  Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.
  $ heroku ps:scale
  web=3:Standard-2X worker=1:Standard-1X
```

## `heroku dyno:stop DYNO`

stop app dyno

```
USAGE
  $ heroku dyno:stop DYNO -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  stop app dyno

  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done
  $ heroku ps:stop run
  Stopping run dynos... done
```

## `heroku features`

list available app features

```
USAGE
  $ heroku features -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  list available app features
```

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  disables an app feature
```

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an app feature
```

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  display information about a feature
```

## `heroku keys`

display your SSH keys

```
USAGE
  $ heroku keys [-l] [--json]

FLAGS
  -l, --long  display full SSH keys
  --json      output in json format

DESCRIPTION
  display your SSH keys
```

## `heroku keys:add [KEY]`

add an SSH key for a user

```
USAGE
  $ heroku keys:add [KEY] [-y]

FLAGS
  -y, --yes  automatically answer yes for all prompts

DESCRIPTION
  add an SSH key for a user
  if no KEY is specified, will try to find ~/.ssh/id_rsa.pub

EXAMPLES
  $ heroku keys:add
  Could not find an existing public key.
  Would you like to generate one? [Yn] y
  Generating new SSH public key.
  Uploading SSH public key /.ssh/id_rsa.pub... done
  $ heroku keys:add /my/key.pub
  Uploading SSH public key /my/key.pub... done
```

## `heroku keys:clear`

remove all SSH keys for current user

```
USAGE
  $ heroku keys:clear

DESCRIPTION
  remove all SSH keys for current user
```

## `heroku keys:remove KEY`

remove an SSH key from the user

```
USAGE
  $ heroku keys:remove KEY

DESCRIPTION
  remove an SSH key from the user


EXAMPLES
  $ heroku keys:remove email@example.com
  Removing email@example.com SSH key... done
```

## `heroku labs`

list experimental features

```
USAGE
  $ heroku labs [--json] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                display as json

DESCRIPTION
  list experimental features
```

## `heroku labs:enable FEATURE`

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  enables an experimental feature
```

## `heroku labs:info FEATURE`

show feature info

```
USAGE
  $ heroku labs:info FEATURE [--json] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                display as json

DESCRIPTION
  show feature info
```

## `heroku maintenance`

display the current maintenance status of app

```
USAGE
  $ heroku maintenance -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  display the current maintenance status of app
```

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  take the app out of maintenance mode
```

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  put the app into maintenance mode
```

## `heroku notifications`

display notifications

```
USAGE
  $ heroku notifications [--all] [--json] [--read] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -r, --remote=<value>  git remote of app to use
  --all                 view all notifications (not just the ones for the current app)
  --json                output in json format
  --read                show notifications already read

DESCRIPTION
  display notifications
```

## `heroku ps [TYPE [TYPE ...]]`

list dynos for an app

```
USAGE
  $ heroku ps [TYPE [TYPE ...]]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                display as json

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

## `heroku ps:kill DYNO`

stop app dyno

```
USAGE
  $ heroku ps:kill DYNO -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  stop app dyno

  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done
  $ heroku ps:stop run
  Stopping run dynos... done
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
```

## `heroku ps:restart [DYNO]`

restart app dynos

```
USAGE
  $ heroku ps:restart [DYNO] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  restart app dynos
  if DYNO is not specified, restarts all dynos on app

EXAMPLES
  $ heroku ps:restart web.1
  Restarting web.1 dyno... done
  $ heroku ps:restart web
  Restarting web dynos... done
  $ heroku ps:restart
  Restarting dynos... done
```

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

EXAMPLES
  $ heroku ps:scale web=3:Standard-2X worker+1
  Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.
  $ heroku ps:scale
  web=3:Standard-2X worker=1:Standard-1X
```

## `heroku ps:stop DYNO`

stop app dyno

```
USAGE
  $ heroku ps:stop DYNO -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  stop app dyno

  stop app dyno or dyno type

EXAMPLES
  $ heroku ps:stop run.1828
  Stopping run.1828 dyno... done
  $ heroku ps:stop run
  Stopping run dynos... done
```

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
```

## `heroku releases`

display the releases for an app

```
USAGE
  $ heroku releases -a <value> [-n <value>] [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -n, --num=<value>     number of releases to show
  -r, --remote=<value>  git remote of app to use
  --json                output releases in json format

DESCRIPTION
  display the releases for an app


EXAMPLES
  $ heroku releases
  === example Releases
  v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
  v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
  v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)
```

## `heroku releases:info [RELEASE]`

view detailed information for a release

```
USAGE
  $ heroku releases:info [RELEASE] -a <value> [--json] [-s] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  -s, --shell           output in shell format
  --json                output in json format

DESCRIPTION
  view detailed information for a release
```

## `heroku releases:output [RELEASE]`

View the release command output

```
USAGE
  $ heroku releases:output [RELEASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  View the release command output
```

## `heroku releases:rollback [RELEASE]`

rollback to a previous release

```
USAGE
  $ heroku releases:rollback [RELEASE] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  rollback to a previous release
  If RELEASE is not specified, it will rollback one release
```
<!-- commandsstop -->
