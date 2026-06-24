<div align="center">
  <img src="assets/Heroku-Logo-Mark-Light-RGB.svg" alt="Heroku logo" width="100">
  <p>&nbsp;</p>

  [![Node CI Suite](https://github.com/heroku/cli/actions/workflows/ci.yml/badge.svg)](https://github.com/heroku/cli/actions/workflows/ci.yml)
  [![npm](https://img.shields.io/npm/v/heroku.svg)](https://www.npmjs.com/package/heroku)
  [![ISC License](https://img.shields.io/github/license/heroku/cli.svg)](https://github.com/heroku/cli/blob/main/LICENSE)
</div>

Overview
========

The Heroku CLI is a command-line interface for managing Heroku applications and services. Built with Node.js and [oclif](https://oclif.io), it provides an extensible architecture for interacting with the Heroku platform.

For more about Heroku see <https://www.heroku.com/home>

To get started see <https://devcenter.heroku.com/start>

Key features of the CLI include:

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

<!-- commandsstop -->

Developing
==========


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

Contributing
=========

Please review our [Contributing guidelines](./CONTRIBUTING.md) as well as our [PR template](./.github/PULL_REQUEST_TEMPLATE.md).
