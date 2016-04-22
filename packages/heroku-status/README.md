CLI Plugin for [Heroku Status](https://status.heroku.com) [![Circle CI](https://circleci.com/gh/heroku/heroku-status.svg?style=svg)](https://circleci.com/gh/heroku/heroku-status)
===========

[![Code Climate](https://codeclimate.com/github/heroku/heroku-status/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-status)
[![Test Coverage](https://codeclimate.com/github/heroku/heroku-status/badges/coverage.svg)](https://codeclimate.com/github/heroku/heroku-status/coverage)
[![npm version](https://badge.fury.io/js/heroku-status.svg)](https://badge.fury.io/js/heroku-status)
[![License](https://img.shields.io/github/license/heroku/heroku-status.svg)](https://github.com/heroku/heroku-status/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Read more about Toolbelt 4.0 plugins [here](https://github.com/heroku/heroku-hello-world#heroku-hello-world).


How to install this plugin
-------------------

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

```
$ heroku plugins:install heroku-status
```

Available commands
-------------------

```bash
$ heroku status
=== Heroku Status
Development: No known issues at this time.
Production: No known issues at this time.
```

or, if there were a real incident...

```bash
$ heroku status
=== Heroku Status
Development: Yellow
Production: Yellow

=== Increased Platform Latency 7:04:22 PM UTC
7:04:22 PM UTC (42 minutes ago) [Issue] We are experiencing a network connectivity issue with our upstream provider. We will post another update as to the status in an hour if not sooner.
```

More about https://devcenter.heroku.com/articles/heroku-status


