Releasing Heroku CLI
====================

[CircleCI will handle releases](https://circleci.com/gh/heroku/cli). Pushing to master automatically will release to the beta channel if the tests are successful. Tagging with a version number will release to stable.

Release to dev channel by pushing to the `dev` branch. Add other dev channels by adding a channel to circle.yml

Instructions:

* Run [np](https://github.com/sindresorhus/np)
* Update [CHANGELOG](https://github.com/heroku/cli/blob/master/CHANGELOG).
* CircleCI will detect the tag and automatically release to stable
* Homebrew: `brew bump-formula-pr --url=https://cli-assets.heroku.com/heroku-cli/channels/stable/heroku-cli-v6.6.17-f15
d070-darwin-x64.tar.xz heroku --version=6.6.17`
