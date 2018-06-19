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
$ npm install -g @heroku-cli/plugin-apps-v5
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-apps-v5/7.3.0 darwin-x64 node-v10.4.1
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
# Command Topics

* [`heroku apps`](docs/apps.md) - creates a new app
* [`heroku buildpacks`](docs/buildpacks.md) - add new app buildpack, inserting into list of buildpacks if necessary
* [`heroku config`](docs/config.md) - set one or more config vars
* [`heroku domains`](docs/domains.md) - add domain to an app
* [`heroku drains`](docs/drains.md) - adds a log drain to an app
* [`heroku dyno`](docs/dyno.md) - restart app dynos
* [`heroku features`](docs/features.md) - disables an app feature
* [`heroku keys`](docs/keys.md) - add an SSH key for a user
* [`heroku labs`](docs/labs.md) - enables an experimental feature
* [`heroku maintenance`](docs/maintenance.md) - display the current maintenance status of app
* [`heroku notifications`](docs/notifications.md) - display notifications
* [`heroku ps`](docs/ps.md) - list dynos for an app
* [`heroku releases`](docs/releases.md) - display the releases for an app

<!-- commandsstop -->
