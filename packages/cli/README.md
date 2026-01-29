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

The Heroku CLI is a command-line interface for managing Heroku applications and services. Built with Node.js and [oclif](https://oclif.io), it provides an extensible architecture for interacting with the Heroku platform.

Key features include:

- **App management** - Deploy, scale, and monitor your applications
- **Heroku Postgres database management** - Backup, restore, and manage Heroku Postgres databases
- **Heroku CI/CD pipelines** - Run automated tests and manage review apps for streamlined deployment workflows
- **Add-ons marketplace** - Provision and manage tools and services to extend your application
- **SSL certificates and domains** - Configure custom domains and automatically manage SSL/TLS certificates
- **Team collaboration** - Manage organization and team access with granular permissions
- **Private Spaces** - Deploy applications in network-isolated environments with VPN support
- **Logs and monitoring** - Stream application logs and forward them to external services
- **Plugin ecosystem** - Extend functionality with community and custom plugins

For more on developing plugins, read [Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-cli-plugins)

Issues
======

For problems directly related to the CLI, [add an issue on GitHub](https://github.com/heroku/cli/issues/new).

For other issues, [submit a support ticket](https://help.heroku.com/).

[Contributors](https://github.com/heroku/cli/contributors)

<!-- commands -->
# Command Topics

* [`heroku access`](docs/access.md) - manage user access to apps
* [`heroku accounts`](docs/accounts.md) - list the Heroku accounts in your cache
* [`heroku addons`](docs/addons.md) - tools and services for developing, extending, and operating your app
* [`heroku ai`](docs/ai.md) - manage Heroku AI models
* [`heroku apps`](docs/apps.md) - manage apps on Heroku
* [`heroku auth`](docs/auth.md) - manage authentication for your Heroku account
* [`heroku authorizations`](docs/authorizations.md) - OAuth authorizations
* [`heroku autocomplete`](docs/autocomplete.md) - display autocomplete installation instructions
* [`heroku buildpacks`](docs/buildpacks.md) - scripts used to compile apps
* [`heroku certs`](docs/certs.md) - SSL certificates
* [`heroku ci`](docs/ci.md) - test runner for Heroku Pipelines
* [`heroku clients`](docs/clients.md) - OAuth clients on the platform
* [`heroku config`](docs/config.md) - environment variables of apps
* [`heroku container`](docs/container.md) - deploy your Docker-based app to Heroku
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
* [`heroku regions`](docs/regions.md) - list available regions for deployment
* [`heroku releases`](docs/releases.md) - display the releases for an app
* [`heroku reviewapps`](docs/reviewapps.md) - manage reviewapps in pipelines
* [`heroku run`](docs/run.md) - run a one-off process inside a Heroku dyno
* [`heroku sessions`](docs/sessions.md) - OAuth sessions
* [`heroku spaces`](docs/spaces.md) - list available spaces
* [`heroku status`](docs/status.md) - display current status of the Heroku platform
* [`heroku teams`](docs/teams.md) - manage teams
* [`heroku telemetry`](docs/telemetry.md) - list telemetry drains
* [`heroku update`](docs/update.md) - update the Heroku CLI
* [`heroku usage`](docs/usage.md) - list usage for metered add-ons attached to an app or apps within a team
* [`heroku version`](docs/version.md)
* [`heroku webhooks`](docs/webhooks.md) - list webhooks on an app

<!-- commandsstop -->

Developing
==========

This project is built with [lerna](https://lerna.js.org/). The core plugins are located in [./packages](./packages). 

After cloning the repo
1. Run `npm install` to install dependencies
2. Run `npm run build` to build the CLI. This will need to be re-run any time you make changes and want to test them locally.

To execute Heroku CLI commands locally, use `./bin/run <command>`. For example, to run the `heroku apps` command with your local code, run `./bin/run apps` from the root directory.

Testing
=======

Run all tests with `npm test`.

## Debugging

Using WebStorm (from JetBrains / IntelliJ), you can run/debug an individual test case.

- Create a new run/debug configuration
- Select the 'Mocha' type

Releasing
=========
See the [Heroku CLI Release Steps](https://salesforce.quip.com/aPLDA1ZwjNlW).

Review our [PR guidelines](./.github/PULL_REQUEST_TEMPLATE.md).
