Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.5.2] - 2017-04-27
### Changed
- Releax engines requirements in package.json.

## [1.5.1] - 2017-04-03
### Changed
- Test output is now read from the `/test-runs/:id/test-nodes` sub-resource.

## [1.4.2] - 2017-03-20
### Fixed
- Fixes a null traversal regression in `ci:debug`. ([#25](https://github.com/heroku/heroku-ci/pull/25)]

## [1.4.1] - 2017-03-17
### Fixed
- Commands which require a git repo to be present now fail with a helpful error. ([#24](https://github.com/heroku/heroku-ci/pull/24)]
