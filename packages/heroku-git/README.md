heroku-git
==========

[![Build Status](https://travis-ci.org/heroku/heroku-git.svg?branch=master)](https://travis-ci.org/heroku/heroku-git)
[![License](https://img.shields.io/github/license/heroku/heroku-git.svg)](https://github.com/heroku/heroku-git/blob/master/LICENSE)

git commands for the Heroku CLI

Commands
========

heroku git:remote
-----------------

Usage: heroku git:remote [OPTIONS]

 adds a git remote to an app repo

 if OPTIONS are specified they will be passed to git remote add

 -a, --app    APP           # the Heroku app to use
 -r, --remote REMOTE        # the git remote to create, default "heroku"
     --ssh-git              # use SSH git protocol

Examples:

 $ heroku git:remote -a example
 set git remote heroku to https://git.heroku.com/example.git

heroku git:clone
----------------

Usage: heroku git:clone [DIRECTORY]

 clones a heroku app to your local machine at DIRECTORY (defaults to app name)

 -a, --app    APP     # the Heroku app to use
 -r, --remote REMOTE  # the git remote to create, default "heroku"
     --ssh-git        # use SSH git protocol


Examples:

 $ heroku git:clone -a example
 Cloning into 'example'...
 remote: Counting objects: 42, done.
 ...
