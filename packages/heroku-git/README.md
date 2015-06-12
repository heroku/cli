# heroku-git [![Circle CI](https://circleci.com/gh/heroku/heroku-git/tree/master.svg?style=svg)](https://circleci.com/gh/heroku/heroku-git/tree/master)

[![License](https://img.shields.io/github/license/heroku/heroku-git.svg)](https://github.com/heroku/heroku-git/blob/master/LICENSE)

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
