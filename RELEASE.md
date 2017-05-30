Releasing Heroku CLI
====================

[CircleCI will handle releases](https://circleci.com/gh/heroku/cli). Pushing to master automatically will release to the beta channel if the tests are successful. Tagging with a version number will release to stable.

Release to dev channel by pushing to the `dev` branch.

Instructions:

* Increment [version](https://github.com/heroku/cli/blob/master/bin/version).
* Update [CHANGELOG](https://github.com/heroku/cli/blob/master/CHANGELOG).
* Commit version & CHANGELOG and push to master
* Tag version `git tag v5.x.x && git push --tags`
* CircleCI will detect the tag and automatically release to stable
