Heroku CLI
==========

![Heroku logo](https://d4yt8xl9b7in.cloudfront.net/assets/home/logotype-heroku.png)
[![Node CI Suite](https://github.com/heroku/cli/actions/workflows/ci.yml/badge.svg)](https://github.com/heroku/cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/heroku.svg)](https://www.npmjs.com/package/heroku)
[![ISC License](https://img.shields.io/github/license/heroku/cli.svg)](https://github.com/heroku/cli/blob/main/LICENSE)

The Heroku CLI is used to manage Heroku apps from the command line. It is built using [oclif](https://oclif.io).

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

<!-- commands -->
# Command Topics

* [`heroku access`](docs/access.md) - manage user access to apps
* [`heroku addons`](docs/addons.md) - tools and services for developing, extending, and operating your app
* [`heroku apps`](docs/apps.md) - manage apps on Heroku
* [`heroku auth`](docs/auth.md) - check 2fa status
* [`heroku authorizations`](docs/authorizations.md) - OAuth authorizations
* [`heroku autocomplete`](docs/autocomplete.md) - display autocomplete installation instructions
* [`heroku buildpacks`](docs/buildpacks.md) - scripts used to compile apps
* [`heroku certs`](docs/certs.md) - a topic for the ssl plugin
* [`heroku ci`](docs/ci.md) - run an application test suite on Heroku
* [`heroku clients`](docs/clients.md) - OAuth clients on the platform
* [`heroku config`](docs/config.md) - environment variables of apps
* [`heroku container`](docs/container.md) - Use containers to build and deploy Heroku apps
* [`heroku domains`](docs/domains.md) - custom domains for apps
* [`heroku drains`](docs/drains.md) - forward logs to syslog or HTTPS
* [`heroku features`](docs/features.md) - add/remove app features
* [`heroku git`](docs/git.md) - set git remote and clone Heroku repository
* [`heroku help`](docs/help.md) - Display help for heroku.
* [`heroku keys`](docs/keys.md) - add/remove account ssh keys
* [`heroku labs`](docs/labs.md) - add/remove experimental features
* [`heroku local`](docs/local.md) - run Heroku app locally
* [`heroku logs`](docs/logs.md) - display recent log output
* [`heroku maintenance`](docs/maintenance.md) - enable/disable access to app
* [`heroku members`](docs/members.md) - manage organization members
* [`heroku notifications`](docs/notifications.md) - display notifications
* [`heroku orgs`](docs/orgs.md) - manage organizations
* [`heroku pg`](docs/pg.md) - manage postgresql databases
* [`heroku pipelines`](docs/pipelines.md) - manage pipelines
* [`heroku plugins`](docs/plugins.md) - List installed plugins.
* [`heroku ps`](docs/ps.md) - Client tools for Heroku Exec
* [`heroku psql`](docs/psql.md) - open a psql shell to the database
* [`heroku redis`](docs/redis.md) - manage heroku redis instances
* [`heroku regions`](docs/regions.md) - list available regions for deployment
* [`heroku releases`](docs/releases.md) - display the releases for an app
* [`heroku reviewapps`](docs/reviewapps.md) - manage reviewapps in pipelines
* [`heroku run`](docs/run.md) - run a one-off process inside a Heroku dyno
* [`heroku sessions`](docs/sessions.md) - OAuth sessions
* [`heroku spaces`](docs/spaces.md) - manage heroku private spaces
* [`heroku status`](docs/status.md) - display current status of the Heroku platform
* [`heroku teams`](docs/teams.md) - manage teams
* [`heroku update`](docs/update.md) - update the Heroku CLI
* [`heroku version`](docs/version.md)
* [`heroku webhooks`](docs/webhooks.md) - list webhooks on an app

<!-- commandsstop -->

Developing
==========

This project is built with [lerna](https://lerna.js.org/). The core plugins are located in [./packages](./packages). 

After cloning the repo
1. Run `yarn` to install dependencies
2. Run `yarn lerna bootstrap` set up Lerna and link the packages together
    - This repo currently uses an older version of Lerna. We recommend using the version specified in the package.json instead of a newer version that you may have installed globally.

To execute Heroku CLI commands locally, use `./bin/run <command>`. For example, to run the `heroku apps` command with your local code, run `./bin/run apps` from the root directory.

Testing
=======

Run all tests with `yarn lerna run test`.

Run one test, in this case plugin-certs-v5, with `yarn lerna run --scope @heroku-cli/plugin-certs-v5 test`.

## Debugging

Using WebStorm (from Jetbrains / IntelliJ), you can run/debug an individual test case.

- Create a new run/debug configuration
- Select the 'Mocha' type
- Set the working directory to the directory of the package you are using.  (i.e. ~/Heroku/Repos/cli/packages/certs-v5)

Releasing
=========
See the [Heroku CLI Release Steps](https://salesforce.quip.com/aPLDA1ZwjNlW).

Review our [PR guidelines](./.github/PULL_REQUEST_TEMPLATE.md).
