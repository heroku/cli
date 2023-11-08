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
@heroku-cli/plugin-apps-v5/9.0.0-dev.0 darwin-arm64 node-v18.16.1
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`heroku apps`](#heroku-apps)
* [`heroku apps:create [APP]`](#heroku-appscreate-app)
* [`heroku apps:destroy`](#heroku-appsdestroy)
* [`heroku apps:errors`](#heroku-appserrors)
* [`heroku apps:info`](#heroku-appsinfo)
* [`heroku apps:open [PATH]`](#heroku-appsopen-path)
* [`heroku apps:rename NEWNAME`](#heroku-appsrename-newname)
* [`heroku config:set`](#heroku-configset)
* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:remove [URL|TOKEN]`](#heroku-drainsremove-urltoken)
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
* [`heroku ps:restart [DYNO]`](#heroku-psrestart-dyno)
* [`heroku ps:scale`](#heroku-psscale)
* [`heroku ps:stop DYNO`](#heroku-psstop-dyno)
* [`heroku ps:type`](#heroku-pstype)
* [`heroku releases`](#heroku-releases)
* [`heroku releases:info [RELEASE]`](#heroku-releasesinfo-release)
* [`heroku releases:output [RELEASE]`](#heroku-releasesoutput-release)
* [`heroku releases:rollback [RELEASE]`](#heroku-releasesrollback-release)

## `heroku apps`

list your apps

```
USAGE
  $ heroku apps [-A] [--json] [-s <value>] [-p] [-t <value>]

FLAGS
  -A, --all            include apps in all teams
  -p, --personal       list apps in personal account when a default team is set
  -s, --space=<value>  filter by space
  -t, --team=<value>   team to use
  --json               output in json format

DESCRIPTION
  list your apps


EXAMPLES
  $ heroku apps
  === My Apps
  example
  example2
  === Collaborated Apps
  theirapp   other@owner.name
```

_See code: [src/commands/apps/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/index.js)_

## `heroku apps:create [APP]`

creates a new app

```
USAGE
  $ heroku apps:create [APP] [--addons <value>] [-b <value>] [-n] [-r <value>] [-s <value>] [--space <value>]
    [--region <value>] [--json] [-t <value>]

ARGUMENTS
  APP  name of app to create

FLAGS
  -b, --buildpack=<value>  buildpack url to use for this app
  -n, --no-remote          do not create a git remote
  -r, --remote=<value>     the git remote to create, default "heroku"
  -s, --stack=<value>      the stack to create the app on
  -t, --team=<value>       team to use
  --addons=<value>         comma-delimited list of addons to install
  --json                   output in json format
  --region=<value>         specify region for the app to run in
  --space=<value>          the private space to create the app in

DESCRIPTION
  creates a new app


EXAMPLES
  $ heroku apps:create
  Creating app... done, stack is heroku-22
  https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git
  # or just
  $ heroku create
  # use a heroku.yml manifest file
  $ heroku apps:create --manifest
  # specify a buildpack
  $ heroku apps:create --buildpack https://github.com/some/buildpack.git
  # specify a name
  $ heroku apps:create example
  # create a staging app
  $ heroku apps:create example-staging --remote staging
  # create an app in the eu region
  $ heroku apps:create --region eu
```

_See code: [src/commands/apps/create.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/create.js)_

## `heroku apps:destroy`

permanently destroy an app

```
USAGE
  $ heroku apps:destroy [APP] [-c <value>] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>      app to run command against
  -c, --confirm=<value>
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  permanently destroy an app
  This will also destroy all add-ons on the app.
```

_See code: [src/commands/apps/destroy.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/destroy.js)_

## `heroku apps:errors`

view app errors

```
USAGE
  $ heroku apps:errors -a <value> [--json] [--hours <value>] [--router] [--dyno] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --dyno                show only dyno errors
  --hours=<value>       number of hours to look back (default 24)
  --json                output in json format
  --router              show only router errors

DESCRIPTION
  view app errors
```

_See code: [src/commands/apps/errors.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/errors.js)_

## `heroku apps:info`

show detailed app information

```
USAGE
  $ heroku apps:info [APP] [-s] [-j] [-a <value>] [-r <value>]

FLAGS
  -a, --app=<value>     app to run command against
  -j, --json
  -r, --remote=<value>  git remote of app to use
  -s, --shell           output more shell friendly key/value pairs

DESCRIPTION
  show detailed app information
  $ heroku apps:info
  === example
  Git URL:   https://git.heroku.com/example.git
  Repo Size: 5M
  ...

  $ heroku apps:info --shell
  git_url=https://git.heroku.com/example.git
  repo_size=5000000
  ...
```

_See code: [src/commands/apps/info.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/info.js)_

## `heroku apps:open [PATH]`

open the app in a web browser

```
USAGE
  $ heroku apps:open [PATH] -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  open the app in a web browser


EXAMPLES
  $ heroku open -a myapp
  # opens https://myapp.herokuapp.com
  $ heroku open -a myapp /foo
  # opens https://myapp.herokuapp.com/foo
```

_See code: [src/commands/apps/open.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/open.js)_

## `heroku apps:rename NEWNAME`

rename an app

```
USAGE
  $ heroku apps:rename NEWNAME -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  rename an app
  This will locally update the git remote if it is set to the old app.

EXAMPLES
  $ heroku apps:rename --app oldname newname
  https://newname-xxxxxxxxxxxx.herokuapp.com/ | https://git.heroku.com/newname.git
  Git remote heroku updated
```

_See code: [src/commands/apps/rename.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/apps/rename.js)_

## `heroku config:set`

set one or more config vars

```
USAGE
  $ heroku config:set -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  set one or more config vars


EXAMPLES
  $ heroku config:set RAILS_ENV=staging
  Setting config vars and restarting example... done, v10
  RAILS_ENV: staging
  $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
  Setting config vars and restarting example... done, v11
  RAILS_ENV: staging
  RACK_ENV:  staging
```

_See code: [src/commands/config/set.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/config/set.js)_

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains -a <value> [--json] [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use
  --json                output in json format

DESCRIPTION
  display the log drains of an app
```

_See code: [src/commands/drains/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/index.js)_

## `heroku drains:add URL`

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL -a <value> [-r <value>]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  adds a log drain to an app
```

_See code: [src/commands/drains/add.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/add.js)_

## `heroku drains:remove [URL|TOKEN]`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove [URL|TOKEN]

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  removes a log drain from an app
```

_See code: [src/commands/drains/remove.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/drains/remove.js)_

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

_See code: [src/commands/features/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/index.js)_

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

_See code: [src/commands/features/disable.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/disable.js)_

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

_See code: [src/commands/features/enable.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/enable.js)_

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

_See code: [src/commands/features/info.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/features/info.js)_

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

_See code: [src/commands/keys/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/keys/index.js)_

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

_See code: [src/commands/keys/add.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/keys/add.js)_

## `heroku keys:clear`

remove all SSH keys for current user

```
USAGE
  $ heroku keys:clear

DESCRIPTION
  remove all SSH keys for current user
```

_See code: [src/commands/keys/clear.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/keys/clear.js)_

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

_See code: [src/commands/keys/remove.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/keys/remove.js)_

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

_See code: [src/commands/labs/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/labs/index.js)_

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

_See code: [src/commands/labs/enable.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/labs/enable.js)_

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

_See code: [src/commands/labs/info.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/labs/info.js)_

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

_See code: [src/commands/maintenance/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/index.js)_

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

_See code: [src/commands/maintenance/off.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/off.js)_

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

_See code: [src/commands/maintenance/on.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/maintenance/on.js)_

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

_See code: [src/commands/notifications/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/notifications/index.js)_

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

_See code: [src/commands/ps/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/ps/index.js)_

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

_See code: [src/commands/ps/restart.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/ps/restart.js)_

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

_See code: [src/commands/ps/scale.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/ps/scale.js)_

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

_See code: [src/commands/ps/stop.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/ps/stop.js)_

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

_See code: [src/commands/ps/type.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/ps/type.js)_

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

_See code: [src/commands/releases/index.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/releases/index.js)_

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

_See code: [src/commands/releases/info.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/releases/info.js)_

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

_See code: [src/commands/releases/output.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/releases/output.js)_

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

_See code: [src/commands/releases/rollback.js](https://github.com/heroku/cli/blob/v9.0.0-dev.0/packages/apps-v5/src/commands/releases/rollback.js)_
<!-- commandsstop -->
