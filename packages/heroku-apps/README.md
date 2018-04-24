heroku-apps [![Circle CI](https://circleci.com/gh/heroku/heroku-apps.svg?style=svg)](https://circleci.com/gh/heroku/heroku-apps)
===========

[![Code Climate](https://codeclimate.com/github/heroku/heroku-apps/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-apps)
[![codecov](https://codecov.io/gh/heroku/heroku-apps/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-apps)
[![npm version](https://badge.fury.io/js/heroku-apps.svg)](https://badge.fury.io/js/heroku-apps)
[![License](https://img.shields.io/github/license/heroku/heroku-apps.svg)](https://github.com/heroku/heroku-apps/blob/master/LICENSE)
[![Greenkeeper badge](https://badges.greenkeeper.io/heroku/heroku-apps.svg)](https://greenkeeper.io/)

This core plugin comes preinstalled to the [Heroku CLI](https://cli.heroku.com).

<!-- usage -->
```sh-session
$ npm install -g @heroku-cli/plugin-apps
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-apps/2.4.38 darwin-x64 node-v9.11.1
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
# Command Topics

* [`heroku 2fa`](docs/2fa.md) - disable 2fa on account

* [`heroku apps`](docs/apps.md) - creates a new app
Examples:

    $ heroku apps:create
    Creating app... done, stack is cedar-14
    https://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git

    # or just
    $ heroku create

    # specify a buildpack
    $ heroku apps:create --buildpack https://github.com/some/buildpack.git

    # specify a name
    $ heroku apps:create example

    # create a staging app
    $ heroku apps:create example-staging --remote staging

    # create an app in the eu region
    $ heroku apps:create --region eu
 
* [`heroku auth`](docs/auth.md) - login with your Heroku credentials

* [`heroku buildpacks`](docs/buildpacks.md) - add new app buildpack, inserting into list of buildpacks if necessary
Example:

     $ heroku buildpacks:add -i 1 https://github.com/heroku/heroku-buildpack-ruby

* [`heroku config`](docs/config.md) - display a config value for an app
Example:

    $ heroku config:get RAILS_ENV
    production
 
* [`heroku domains`](docs/domains.md) - add domain to an app

* [`heroku drains`](docs/drains.md) - adds a log drain to an app

* [`heroku dyno`](docs/dyno.md) - restart app dynos

if DYNO is not specified, restarts all dynos on app

Examples:

    $ heroku ps:restart web.1
    Restarting web.1 dyno... done

    $ heroku ps:restart web
    Restarting web dynos... done

    $ heroku ps:restart
    Restarting dynos... done

* [`heroku features`](docs/features.md) - disables an app feature

* [`heroku keys`](docs/keys.md) - add an SSH key for a user
if no KEY is specified, will try to find ~/.ssh/id_rsa.pub

Examples:

    $ heroku keys:add
    Could not find an existing public key.
    Would you like to generate one? [Yn] y
    Generating new SSH public key.
    Uploading SSH public key /.ssh/id_rsa.pub... done

    $ heroku keys:add /my/key.pub
    Uploading SSH public key /my/key.pub... done

* [`heroku labs`](docs/labs.md) - enables an experimental feature

* [`heroku logout`](docs/logout.md) - clears local login credentials

* [`heroku maintenance`](docs/maintenance.md) - display the current maintenance status of app

* [`heroku notifications`](docs/notifications.md) - display notifications

* [`heroku ps`](docs/ps.md) - list dynos for an app

Examples:

    $ heroku ps
    === run: one-off dyno
    run.1: up for 5m: bash
    
    === web: bundle exec thin start -p $PORT
    web.1: created for 30s
    
    $ heroku ps run # specifying types
    === run: one-off dyno
    run.1: up for 5m: bash
* [`heroku releases`](docs/releases.md) - display the releases for an app

Example:

    $ heroku releases
    === example Releases
    v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
    v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
    v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)
* [`heroku twofactor`](docs/twofactor.md) - disable 2fa on account

<!-- commandsstop -->
