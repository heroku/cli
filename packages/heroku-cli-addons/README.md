# heroku-cli-addons [![Circle CI](https://circleci.com/gh/heroku/heroku-cli-addons.svg?style=svg)](https://circleci.com/gh/heroku/heroku-cli-addons)

[![Code Climate](https://codeclimate.com/github/heroku/heroku-cli-addons/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-cli-addons)
[![Test Coverage](https://codeclimate.com/github/heroku/heroku-cli-addons/badges/coverage.svg)](https://codeclimate.com/github/heroku/heroku-cli-addons/coverage)
[![npm version](https://badge.fury.io/js/heroku-cli-addons.svg)](https://badge.fury.io/js/heroku-cli-addons)
[![License](https://img.shields.io/github/license/heroku/heroku-cli-addons.svg)](https://github.com/heroku/heroku-cli-addons/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

This re-implements the `heroku addons [--app APP|--all]` command in Node with a
new UX which aims to make the concepts clearer and the relationships between
them more accessible.

Example output:

``` sh-session
$ heroku addons -a addons-reports
Add-on                              Plan                              Price
──────────────────────────────────  ────────────────────────────────  ───────────────────────────
flowing-tidily-5466                 heroku-postgresql:kappa           (billed to addons app)
 ├─ support-api::ADDONS_DATABASE
 ├─ ADDONS_DATABASE
 ├─ addons::HEROKU_POSTGRESQL_BLUE
 └─ addons::DATABASE
practicing-nobly-1495               heroku-postgresql:premium-yanari  $200/month
 ├─ DATABASE
 ├─ addons::ADDONS_REPORTS
 └─ HEROKU_POSTGRESQL_SILVER
swimming-truly-2371                 openredis:micro                   $8/month
 └─ OPENREDIS
cooling-avidly-8928                 ?                                 (billed to vault-usage app)
 └─ VAULT_USAGE

```

As an experiment, it also makes use of ANSI colours where appropriate, by highlighting
reference types by consistent colours and dimming non-critical information:

![colour example](https://cloud.githubusercontent.com/assets/66427/9675115/55693244-526e-11e5-95aa-dd437c24d5f1.png)

## Install

### Latest dev version

``` sh-session
$ git clone https://github.com/heroku/heroku-cli-addons.git heroku-cli-addons
$ cd heroku-cli-addons
$ npm install                # dependencies
$ heroku plugins:link
```

If you run into any problems, open an issue. You can remove the plugin in the
meantime if it's borked:

``` sh-session
$ rm ~/.heroku/node_modules/heroku-cli-addons
```

## Developing

```sh-session
$ npm install                     # install all dependencies
$ npm test                        # run the tests
$ npm version <major|minor|patch> # bump the version number and publish to npm
```
