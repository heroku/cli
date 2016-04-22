heroku-local [![Circle CI](https://circleci.com/gh/heroku/heroku-local/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-local/tree/master)
============

[![Code Climate](https://codeclimate.com/github/heroku/heroku-local/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-local)
[![npm version](https://badge.fury.io/js/heroku-local.svg)](https://badge.fury.io/js/heroku-local)
[![License](https://img.shields.io/github/license/heroku/heroku-local.svg)](https://github.com/heroku/heroku-local/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Run heroku apps locally. This plugin is built into the Heroku Toolbelt, you do not need to install it separately.

To use:

```
$ heroku local
12:47:17 PM web.1 | listening on 3000
```

This command internally uses [node-foreman](https://github.com/strongloop/node-foreman) to run the app locally.

Help
=======

```
$ heroku help local

Usage: heroku local [PROCESSNAME]

 run heroku app locally

 Start the application specified by a Procfile (defaults to ./Procfile)

 Examples:

   heroku local
   heroku local web
   heroku local -f Procfile.test -e .env.test

 -f, --procfile PROCFILE
 -e, --env ENV
 -p, --port PORT

Additional commands, type "heroku help COMMAND" for more details:

  local:version  #  display node-foreman version
```
