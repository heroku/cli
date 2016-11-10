# Heroku CI CLI
[![Heroku CI Status](https://ci-badges.herokuapp.com/pipelines/420ca0bc-031b-479a-9335-1d51046daab2/master.svg)](https://dashboard.heroku.com/pipelines/420ca0bc-031b-479a-9335-1d51046daab2/tests)

The CLI plugin for Heroku CI

## Installation
```sh
heroku plugins:install heroku-ci
```

## Commands

All commands accept a `-a` flag. This should be the name of an app in the pipeline you have connected to Heroku CI. The `-a` flag can be omitted if you are in the directory of an app already.

`heroku ci:list`, aliased as `heroku ci`

Show the statuses of the most recent test runs. Add the `-w` or `--watch` flag to keep the session running and listen for updates.

`heroku ci:info NUMBER`

Show the status of a specific test run. If no run number is provided the most recent will be shown.

`heroku ci:last`

Show the status of the most recent test run

`heroku ci:run`

Run this from within your repo directory to trigger a test agains the current branch and commit.

`heroku ci:rerun NUMBER`

Re-run a previous test run. If no test run number is provided, the most recent test run will be re-run.
