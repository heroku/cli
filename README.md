Heroku CLI
==========

![Heroku logo](https://d4yt8xl9b7in.cloudfront.net/assets/home/logotype-heroku.png)

[![Greenkeeper badge](https://badges.greenkeeper.io/heroku/cli.svg)](https://greenkeeper.io/)
[![Circle CI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/cli/tree/master)
[![Build status](https://ci.appveyor.com/api/projects/status/ouee3b9d7jwkjcr1/branch/master?svg=true)](https://ci.appveyor.com/project/Heroku/cli/branch/master)
[![CircleCI](https://circleci.com/gh/heroku/cli-macos-installer/tree/master.svg?style=svg&circle-token=90b3b4392dc1668e97108edabdfc2c6baddc3a17)](https://circleci.com/gh/heroku/cli-macos-installer/tree/master)
[![Snap Status](https://build.snapcraft.io/badge/heroku/cli.svg)](https://build.snapcraft.io/user/heroku/cli)
[![ISC License](https://img.shields.io/github/license/heroku/cli.svg)](https://github.com/heroku/cli/blob/master/LICENSE)
[![homebrew](https://img.shields.io/homebrew/v/heroku.svg)](https://github.com/Homebrew/homebrew-core/blob/master/Formula/heroku.rb)
[![npm](https://img.shields.io/npm/v/heroku-cli.svg)](https://www.npmjs.com/package/heroku-cli)

The Heroku CLI is used to manage Heroku apps from the command line.

For more about Heroku see <https://www.heroku.com/home>

To get started see <https://devcenter.heroku.com/start>

Overview
========

This is the next generation Node-based Heroku CLI.  The goals of this project were to make plugins more flexible, remove Ruby as a runtime dependency, and make the CLI faster.

It has identical functionality to the old Ruby CLI. Under the hood, it is a modular CLI made up of node.js plugins.

For more on developing plugins, read [Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-cli-plugins)

Issues
======

For problems directly related to the CLI, [add an issue on GitHub](https://github.com/heroku/cli/issues/new).

For other issues, [submit a support ticket](https://help.heroku.com/).

[Contributors](https://github.com/heroku/cli/contributors)

Developing
==========

Developing the CLI locally requires node.

The bulk of the code for this project lives at [heroku/cli-engine](https://github.com/heroku/cli-engine) and its dependencies.

To run the CLI locally, use the `./bin/run` script.

**Alpha build note:** To make the run script operable, you must use yarn >= 0.21.3. After the initial project `yarn install`, do the following:

```
cd ./node_modules/cli-engine
yarn install
yarn prepare
```

<!-- usage -->
# Usage

```sh-session
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
heroku-cli/6.15.22 (darwin-x64) node-v9.5.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND [OPTIONS]
...
```
<!-- usagestop -->
<!-- commands -->
# Command Topics

* [heroku access](docs/access.md) - manage user access to apps
* [heroku addons](docs/addons.md)
* [heroku apps](docs/apps.md) - manage apps
* [heroku auth](docs/auth.md) - heroku authentication
* [heroku authorizations](docs/authorizations.md) - OAuth authorizations
* [heroku buildpacks](docs/buildpacks.md) - manage the buildpacks for an app
* [heroku certs](docs/certs.md) - a topic for the ssl plugin
* [heroku ci](docs/ci.md)
* [heroku clients](docs/clients.md) - OAuth clients on the platform
* [heroku config](docs/config.md) - manage app config vars
* [heroku container](docs/container.md)
* [heroku domains](docs/domains.md) - manage the domains for an app
* [heroku drains](docs/drains.md) - list all log drains
* [heroku features](docs/features.md) - manage optional features
* [heroku git](docs/git.md)
* [heroku help](docs/help.md)
* [heroku keys](docs/keys.md) - manage ssh keys
* [heroku labs](docs/labs.md) - experimental features
* [heroku local](docs/local.md)
* [heroku logout](docs/logout.md)
* [heroku logs](docs/logs.md) - display recent log output
* [heroku maintenance](docs/maintenance.md) - manage maintenance mode for an app
* [heroku members](docs/members.md) - manage organization members
* [heroku notifications](docs/notifications.md) - display notifications
* [heroku orgs](docs/orgs.md) - manage organizations
* [heroku pg](docs/pg.md) - manage postgresql databases
* [heroku pipelines](docs/pipelines.md)
* [heroku plugins](docs/plugins.md)
* [heroku ps](docs/ps.md) - manage dynos (dynos, workers)
* [heroku psql](docs/psql.md)
* [heroku redis](docs/redis.md)
* [heroku regions](docs/regions.md) - list available regions
* [heroku releases](docs/releases.md) - manage app releases
* [heroku run](docs/run.md) - run a one-off process inside a Heroku dyno
* [heroku sessions](docs/sessions.md) - OAuth sessions
* [heroku spaces](docs/spaces.md) - manage heroku private spaces
* [heroku teams](docs/teams.md) - manage teams
* [heroku webhooks](docs/webhooks.md)

<!-- commandsstop -->
