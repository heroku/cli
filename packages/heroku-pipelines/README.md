# Pipelines Plugin for Heroku Toolbelt

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[![npm
version](https://img.shields.io/npm/v/heroku-pipelines.svg)](https://www.npmjs.com/package/heroku-pipelines)
[![build status](https://img.shields.io/circleci/project/heroku/heroku-pipelines.svg)](https://circleci.com/gh/heroku/heroku-pipelines)
[![codecov](https://codecov.io/gh/heroku/heroku-pipelines/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-pipelines)

A Heroku CLI plugin for [continuous delivery](https://www.heroku.com/continuous-delivery) on Heroku.

This plugin is used to set up a collection of apps sharing a common codebase where the latest slug of one app can be promoted to the app(s) in the following stage. The promotion only copies the upstream build artifact and leaves the downstream app's config vars, add-ons, and Git repo untouched.

## How to install this plugin

This plugin is installed by default with the
[Heroku Toolbelt](https://toolbelt.heroku.com/). You do not need to install it
yourself. Just update your Toolbelt and plugins:

```
$ heroku update
```

## Using Pipelines

https://devcenter.heroku.com/articles/pipelines

## Development

First, please read [Developing CLI Plugins on Heroku's DevCenter](https://devcenter.heroku.com/articles/developing-toolbelt-plug-ins).

#### Run Tests

```
$ npm test
```

#### Deploy

1. Release a new version of this npm package.

  ```
  $ npm version patch/minor/major
  ```

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropriate heroku-pipelines version.
