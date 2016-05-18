heroku-run [![Circle CI](https://circleci.com/gh/heroku/heroku-run.svg?style=svg)](https://circleci.com/gh/heroku/heroku-run)
==========

[![codecov](https://codecov.io/gh/heroku/heroku-run/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-run)
[![License](https://img.shields.io/github/license/heroku/heroku-run.svg)](https://github.com/heroku/heroku-run/blob/master/LICENSE)

Heroku CLI plugin to run one-off dyno processes.

Commands
========

heroku run
----------

run a one-off process inside a heroku dyno

`-s, --size` dyno size

`--exit-code` passthrough the exit code of the remote command

```
run a one-off process inside a Heroku dyno
Example:

  $ heroku run bash
  Running bash on app... up, run.1
  ~ $

  $ heroku run -s hobby -- myscript.sh -a arg1 -s arg2
  Running myscript.sh -a arg1 -s arg2 on app... up, run.1

```
