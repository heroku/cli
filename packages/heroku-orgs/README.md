Heroku Orgs CLI [![CircleCI](https://circleci.com/gh/heroku/heroku-orgs/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-orgs/tree/master)
===========
[![Code Climate](https://codeclimate.com/github/heroku/heroku-orgs/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-orgs)
[![codecov](https://codecov.io/gh/heroku/heroku-orgs/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-orgs)
[![npm version](https://badge.fury.io/js/heroku-orgs.svg)](https://badge.fury.io/js/heroku-orgs)
[![License](https://img.shields.io/github/license/heroku/heroku-orgs.svg)](https://github.com/heroku/heroku-orgs/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

### Available commands

https://github.com/heroku/heroku-orgs/blob/master/index.js.

### Development

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

2. Open a new pr in https://github.com/heroku/cli/blob/master/package.json, updating to the appropriate heroku-orgs version.
