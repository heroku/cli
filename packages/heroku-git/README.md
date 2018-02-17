# heroku-git [![Circle CI](https://circleci.com/gh/heroku/heroku-git/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-git/tree/master)

[![Code Climate](https://codeclimate.com/github/heroku/heroku-git/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-git)
[![Test Coverage](https://codeclimate.com/github/heroku/heroku-git/badges/coverage.svg)](https://codeclimate.com/github/heroku/heroku-git/coverage)
[![npm version](https://badge.fury.io/js/heroku-git.svg)](https://badge.fury.io/js/heroku-git)
[![License](https://img.shields.io/github/license/heroku/heroku-git.svg)](https://github.com/heroku/heroku-git/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Heroku CLI plugin to manage local git repos.

Commands
========

heroku git:remote
-----------------

adds a git remote to an app repo

`-a, --app` the Heroku app to use

`-r, --remote` the git remote to create

`--ssh-git` use SSH git protocol

```
extra arguments will be passed to git remote add

Examples:

  $ heroku git:remote -a example set git remote heroku to https://git.heroku.com/example.git
```

heroku git:clone [DIRECTORY]
----------------------------

clones a heroku app to your local machine at DIRECTORY (defaults to app name)

`-a, --app` the Heroku app to use

`-r, --remote` the git remote to create, default "heroku"

`--ssh-git` use SSH git protocol

```
Examples:

  $ heroku git:clone -a example
  Cloning into 'example'...
  remote: Counting objects: 42, done.
  ...
```
<!-- commands -->
# Commands

* [@heroku-cli/plugin-git git:clone [DIRECTORY]](#gitclone-directory)
* [@heroku-cli/plugin-git git:remote](#gitremote)
## git:clone [DIRECTORY]

clones a heroku app to your local machine at DIRECTORY (defaults to app name)

```
USAGE
  $ @heroku-cli/plugin-git git:clone [DIRECTORY]

ARGUMENTS
  DIRECTORY  where to clone the app

OPTIONS
  -a, --app=app        the Heroku app to use
  -r, --remote=remote  the git remote to create, default "heroku"
  --ssh-git            use SSH git protocol

DESCRIPTION
  Examples:

       $ heroku git:clone -a example
       Cloning into 'example'...
       remote: Counting objects: 42, done.
       ...
```

## git:remote

adds a git remote to an app repo

```
USAGE
  $ @heroku-cli/plugin-git git:remote

OPTIONS
  -a, --app=app        the Heroku app to use
  -r, --remote=remote  the git remote to create
  --ssh-git            use SSH git protocol

DESCRIPTION
  extra arguments will be passed to git remote add

  Examples:

       # set git remote heroku to https://git.heroku.com/example.git
       $ heroku git:remote -a example

       # set git remote heroku-staging to https://git.heroku.com/example-staging.git
       $ heroku git:remote --remote heroku-staging -a example
```
<!-- commandsstop -->
