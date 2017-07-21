Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.9.2] - 2017-07-21
### Changed
- Use upstream of CLI plugin `heroku-run`, which is used to streamify from the  the dyno.
- Remove code that was used as intermediate fallback while we transitioned over in one of our backend services.

## [1.9.1] - 2017-07-11
### Fixed
- Fixed a bug introduced in 1.9.0 with attaching to an already started one off dyno

## [1.9.0] - 2017-07-07
### Changed
- Changed the debug run implementation to allow for the server to configure the run

## [1.8.0] - 2017-06-02
### Fixed
- Debug runs now include the same Heroku provided config as regular test runs (`HEROKU_TEST_RUN_ID`, `HEROKU_TEST_RUN_BRANCH` `CI_NODE_INDEX` and `CI_NODE_TOTAL`)

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
