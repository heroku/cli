Releasing Toolbelt v4
=====================

Prerequisites:

* `gem install rake aws-sdk`
* `heroku/heroku-cli` repo
* `HEROKU_RELEASE_ACCESS` and `HEROKU_RELEASE_SECRET` (from Toolbelt v3)

Increment [version](https://github.com/heroku/heroku-cli/blob/master/version).
Update [CHANGELOG](https://github.com/heroku/heroku-cli/blob/master/CHANGELOG).
[optional] Update dev branch with latest changes.
[optional] Run `rake release` on dev branch to test changes.
Run `rake release` on master branch.
