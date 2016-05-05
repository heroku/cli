Heroku CLI
==========

![](https://d4yt8xl9b7in.cloudfront.net/assets/home/logotype-heroku.png)

[![Circle CI](https://circleci.com/gh/heroku/cli/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/cli/tree/master)
[![Build status](https://ci.appveyor.com/api/projects/status/ouee3b9d7jwkjcr1/branch/master?svg=true)](https://ci.appveyor.com/project/Heroku/cli/branch/master)
[![MIT License](https://img.shields.io/github/license/heroku/cli.svg)](https://github.com/heroku/cli/blob/master/LICENSE)
[![Go Report Card](https://goreportcard.com/badge/github.com/heroku/cli)](https://goreportcard.com/report/github.com/heroku/cli)
[![codebeat badge](https://codebeat.co/badges/78afe7cb-2634-490e-a450-b6edbd299fc2)](https://codebeat.co/projects/github-com-heroku-cli)

The Heroku CLI is used to manage Heroku apps from the command line.

For more about Heroku see <https://www.heroku.com/home>

To get started see <https://devcenter.heroku.com/start>

Overview
========

This is the next generation Go/Node-based Heroku CLI. Currently, it is not feature complete with the existing CLI and not intended to be used standalone. It is used internally inside the existing Ruby CLI for some commands.

The goals of this project were to make plugins more flexible, remove Ruby as a runtime dependency, and make the CLI faster.

We are in the process of migrating commands over, some you can try out include: `heroku status`, `heroku fork`, and `heroku git:remote`.

Architecture
============

This CLI is written both in Go and node. The core part of the CLI is this Go project and manages a node installation in `~/.heroku`. It handles taking in arguments, updating itself and node plugins, as well as some core commands like `heroku login`.

Most commands are plugins. An example of one would be [heroku-git](https://github.com/heroku/heroku-git). You can install it with `heroku plugins:install` and use it with `heroku git:remote`. When you install it, it uses npm to install the plugin into `~/.heroku/node_plugins/heroku-git`. Then, the commands become available to the CLI.

Once we have plugins to replicate every command in the Ruby CLI, we will then ship this CLI standalone.

For more on developing plugins, [read the blog announcement](https://blog.heroku.com/archives/2015/3/19/making_cli_plugins_better_with_a_new_architecture)

Issues
======

For problems directly related to the CLI, [add an issue on GitHub](https://github.com/heroku/cli/issues/new).

For other issues, [submit a support ticket](https://help.heroku.com/).

[Contributors](https://github.com/heroku/cli/contributors)

Developing
==========

To run the CLI locally, use the `./bin/run` script. If you want to install the dev version of the CLI, run `make install`.
