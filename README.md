Heroku CLI
==========

![Heroku logo](https://d4yt8xl9b7in.cloudfront.net/assets/home/logotype-heroku.png)

[![Circle CI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/cli/tree/master)
[![Build status](https://ci.appveyor.com/api/projects/status/ouee3b9d7jwkjcr1/branch/master?svg=true)](https://ci.appveyor.com/project/Heroku/cli/branch/master)
[![ISC License](https://img.shields.io/github/license/heroku/cli.svg)](https://github.com/heroku/cli/blob/master/LICENSE)
[![Go Report Card](https://goreportcard.com/badge/github.com/heroku/cli)](https://goreportcard.com/report/github.com/heroku/cli)
[![codebeat badge](https://codebeat.co/badges/78afe7cb-2634-490e-a450-b6edbd299fc2)](https://codebeat.co/projects/github-com-heroku-cli)
[![codecov](https://codecov.io/gh/heroku/cli/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/cli)

The Heroku CLI is used to manage Heroku apps from the command line.

For more about Heroku see <https://www.heroku.com/home>

To get started see <https://devcenter.heroku.com/start>

Overview
========

This is the next generation Go/Node-based Heroku CLI.  The goals of this project were to make plugins more flexible, remove Ruby as a runtime dependency, and make the CLI faster.

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

To run the CLI locally, use the `./bin/run` script.

**Alpha build note:** To make the run script operable, you must use yarn >= 0.21.3. After the initial project `yarn install`, do the following:

```
cd ./node_modules/cli-engine
yarn install
yarn prepare
```
