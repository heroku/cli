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
$ heroku (-v|--version|version)
@heroku-cli/plugin-apps-v5/7.67.0 darwin-x64 node-v16.13.2
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
* [`heroku apps:favorites`](#heroku-appsfavorites)
* [`heroku apps:favorites:add`](#heroku-appsfavoritesadd)
* [`heroku apps:favorites:remove`](#heroku-appsfavoritesremove)
* [`heroku apps:info`](#heroku-appsinfo)
* [`heroku apps:open [PATH]`](#heroku-appsopen-path)
* [`heroku apps:rename NEWNAME`](#heroku-appsrename-newname)
* [`heroku apps:stacks`](#heroku-appsstacks)
* [`heroku apps:stacks:set STACK`](#heroku-appsstacksset-stack)
* [`heroku config:set`](#heroku-configset)
* [`heroku drains`](#heroku-drains)
* [`heroku drains:add URL`](#heroku-drainsadd-url)
* [`heroku drains:remove [URL|TOKEN]`](#heroku-drainsremove-urltoken)
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

## `heroku apps`

list your apps

```
USAGE
  $ heroku apps

OPTIONS
  -A, --all          include apps in all teams
  -p, --personal     list apps in personal account when a default team is set
  -s, --space=space  filter by space
  -t, --team=team    team to use
  --json             output in json format

EXAMPLES
  $ heroku apps
  === My Apps
  example
  example2

  === Collaborated Apps
  theirapp   other@owner.name
```

## `heroku apps:create [APP]`

creates a new app

```
USAGE
  $ heroku apps:create [APP]

ARGUMENTS
  APP  name of app to create

OPTIONS
  -b, --buildpack=buildpack  buildpack url to use for this app
  -n, --no-remote            do not create a git remote
  -r, --remote=remote        the git remote to create, default "heroku"
  -s, --stack=stack          the stack to create the app on
  -t, --team=team            team to use
  --addons=addons            comma-delimited list of addons to install
  --json                     output in json format
  --region=region            specify region for the app to run in
  --space=space              the private space to create the app in

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

## `heroku apps:destroy`

permanently destroy an app

```
USAGE
  $ heroku apps:destroy

OPTIONS
  -a, --app=app          app to run command against
  -c, --confirm=confirm
  -r, --remote=remote    git remote of app to use

DESCRIPTION
  This will also destroy all add-ons on the app.
```

## `heroku apps:errors`

view app errors

```
USAGE
  $ heroku apps:errors

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --dyno               show only dyno errors
  --hours=hours        number of hours to look back (default 24)
  --json               output in json format
  --router             show only router errors
```

## `heroku apps:favorites`

list favorited apps

```
USAGE
  $ heroku apps:favorites

OPTIONS
  --json  output in json format
```

## `heroku apps:favorites:add`

favorites an app

```
USAGE
  $ heroku apps:favorites:add

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:favorites:remove`

unfavorites an app

```
USAGE
  $ heroku apps:favorites:remove

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:info`

show detailed app information

```
USAGE
  $ heroku apps:info

OPTIONS
  -a, --app=app        app to run command against
  -j, --json
  -r, --remote=remote  git remote of app to use
  -s, --shell          output more shell friendly key/value pairs

DESCRIPTION
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

## `heroku apps:open [PATH]`

open the app in a web browser

```
USAGE
  $ heroku apps:open [PATH]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku open -a myapp
  # opens https://myapp.herokuapp.com

  $ heroku open -a myapp /foo
  # opens https://myapp.herokuapp.com/foo
```

## `heroku apps:rename NEWNAME`

rename an app

```
USAGE
  $ heroku apps:rename NEWNAME

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  This will locally update the git remote if it is set to the old app.

EXAMPLES
  $ heroku apps:rename --app oldname newname
  https://newname.herokuapp.com/ | https://git.heroku.com/newname.git
  Git remote heroku updated
```

## `heroku apps:stacks`

show the list of available stacks

```
USAGE
  $ heroku apps:stacks

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku apps:stacks:set STACK`

set the stack of an app

```
USAGE
  $ heroku apps:stacks:set STACK

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku stack:set heroku-22 -a myapp
  Setting stack to heroku-22... done
  You will need to redeploy myapp for the change to take effect.
  Run git push heroku main to trigger a new build on myapp.
```

## `heroku config:set`

set one or more config vars

```
USAGE
  $ heroku config:set

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

EXAMPLES
  $ heroku config:set RAILS_ENV=staging
  Setting config vars and restarting example... done, v10
  RAILS_ENV: staging

  $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
  Setting config vars and restarting example... done, v11
  RAILS_ENV: staging
  RACK_ENV:  staging
```

## `heroku drains`

display the log drains of an app

```
USAGE
  $ heroku drains

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku drains:add URL`

adds a log drain to an app

```
USAGE
  $ heroku drains:add URL

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku drains:remove [URL|TOKEN]`

removes a log drain from an app

```
USAGE
  $ heroku drains:remove [URL|TOKEN]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku dyno:kill DYNO`

stop app dyno

```
USAGE
  $ heroku dyno:kill DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku dyno:resize

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## `heroku dyno:restart [DYNO]`

restart app dynos

```
USAGE
  $ heroku dyno:restart [DYNO]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku dyno:scale

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku dyno:stop DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku features

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku features:disable FEATURE`

disables an app feature

```
USAGE
  $ heroku features:disable FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku features:enable FEATURE`

enables an app feature

```
USAGE
  $ heroku features:enable FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku features:info FEATURE`

display information about a feature

```
USAGE
  $ heroku features:info FEATURE

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               output in json format
```

## `heroku keys`

display your SSH keys

```
USAGE
  $ heroku keys

OPTIONS
  -l, --long  display full SSH keys
  --json      output in json format
```

## `heroku keys:add [KEY]`

add an SSH key for a user

```
USAGE
  $ heroku keys:add [KEY]

OPTIONS
  -y, --yes  automatically answer yes for all prompts

DESCRIPTION
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
```

## `heroku keys:remove KEY`

remove an SSH key from the user

```
USAGE
  $ heroku keys:remove KEY

EXAMPLES
  $ heroku keys:remove email@example.com
  Removing email@example.com SSH key... done
```

## `heroku labs`

list experimental features

```
USAGE
  $ heroku labs

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json
```

## `heroku labs:enable FEATURE`

enables an experimental feature

```
USAGE
  $ heroku labs:enable FEATURE

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku labs:info FEATURE`

show feature info

```
USAGE
  $ heroku labs:info FEATURE

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json
```

## `heroku maintenance`

display the current maintenance status of app

```
USAGE
  $ heroku maintenance

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku maintenance:off`

take the app out of maintenance mode

```
USAGE
  $ heroku maintenance:off

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku maintenance:on`

put the app into maintenance mode

```
USAGE
  $ heroku maintenance:on

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku notifications`

display notifications

```
USAGE
  $ heroku notifications

OPTIONS
  -a, --app=app        app to run command against
  -r, --remote=remote  git remote of app to use
  --all                view all notifications (not just the ones for the current app)
  --json               output in json format
  --read               show notifications already read
```

## `heroku ps [TYPE [TYPE ...]]`

list dynos for an app

```
USAGE
  $ heroku ps [TYPE [TYPE ...]]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  --json               display as json

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
  $ heroku ps:kill DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku ps:resize

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## `heroku ps:restart [DYNO]`

restart app dynos

```
USAGE
  $ heroku ps:restart [DYNO]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku ps:scale

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku ps:stop DYNO

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
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
  $ heroku ps:type

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  Called with no arguments shows the current dyno size.

  Called with one argument sets the size.
  Where SIZE is one of eco|basic|standard-1x|standard-2x|performance

  Called with 1..n TYPE=SIZE arguments sets the quantity per type.
```

## `heroku releases`

display the releases for an app

```
USAGE
  $ heroku releases

OPTIONS
  -a, --app=app        (required) app to run command against
  -n, --num=num        number of releases to show
  -r, --remote=remote  git remote of app to use
  --json               output releases in json format

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
  $ heroku releases:info [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
  -s, --shell          output in shell format
  --json               output in json format
```

## `heroku releases:output [RELEASE]`

View the release command output

```
USAGE
  $ heroku releases:output [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use
```

## `heroku releases:rollback [RELEASE]`

rollback to a previous release

```
USAGE
  $ heroku releases:rollback [RELEASE]

OPTIONS
  -a, --app=app        (required) app to run command against
  -r, --remote=remote  git remote of app to use

DESCRIPTION
  If RELEASE is not specified, it will rollback one release
```
<!-- commandsstop -->
