<a name="2.5.0"></a>
# [2.5.0](https://github.com/heroku/heroku-apps/compare/v2.4.42...v2.5.0) (2018-05-16)


### Features

* Add a `--manifest` option for beta users to support heroku.yml files. ([#228](https://github.com/heroku/heroku-apps/issues/228)) ([5b58a90](https://github.com/heroku/heroku-apps/commit/5b58a90))

<a name="2.4.42"></a>
## [2.4.42](https://github.com/heroku/heroku-apps/compare/v2.4.41...v2.4.42) (2018-05-10)


### Bug Fixes

* remove config and config:get ([8c14e01](https://github.com/heroku/heroku-apps/commit/8c14e01))

<a name="2.4.41"></a>
## [2.4.41](https://github.com/heroku/heroku-apps/compare/v2.4.40...v2.4.41) (2018-05-10)


### Bug Fixes

* remove co-wait ([e32be18](https://github.com/heroku/heroku-apps/commit/e32be18))
* remove dependency on bluebird ([65dce95](https://github.com/heroku/heroku-apps/commit/65dce95))
* remove mz, mkdirp, and string dependencies ([cc7c962](https://github.com/heroku/heroku-apps/commit/cc7c962))

<a name="2.4.39"></a>
## [2.4.39](https://github.com/heroku/heroku-apps/compare/v2.4.38...v2.4.39) (2018-05-01)


### Bug Fixes

* updated command ([09d1973](https://github.com/heroku/heroku-apps/commit/09d1973))

<a name="2.4.37"></a>
## [2.4.37](https://github.com/heroku/heroku-apps/compare/v2.4.36...v2.4.37) (2018-04-16)


### Bug Fixes

* update heroku-cli-util netrc multiline ([2de43da](https://github.com/heroku/heroku-apps/commit/2de43da))

<a name="2.4.36"></a>
## [2.4.36](https://github.com/heroku/heroku-apps/compare/v2.4.35...v2.4.36) (2018-04-09)


### Bug Fixes

* fixed tests on non-tty ([036ee3b](https://github.com/heroku/heroku-apps/commit/036ee3b))

<a name="2.4.35"></a>
## [2.4.35](https://github.com/heroku/heroku-apps/compare/v2.4.34...v2.4.35) (2018-04-09)


### Bug Fixes

* move standard to dev ([5eb08bd](https://github.com/heroku/heroku-apps/commit/5eb08bd))

<a name="2.4.34"></a>
## [2.4.34](https://github.com/heroku/heroku-apps/compare/v2.4.33...v2.4.34) (2018-04-09)


### Bug Fixes

* fixed release output when not tty ([a1d7a2a](https://github.com/heroku/heroku-apps/commit/a1d7a2a))

<a name="2.4.33"></a>
## [2.4.33](https://github.com/heroku/heroku-apps/compare/v2.4.32...v2.4.33) (2018-04-06)


### Bug Fixes

* fixed circle workflow name ([9328e33](https://github.com/heroku/heroku-apps/commit/9328e33))
* fixed greenkeeper script ([a303f41](https://github.com/heroku/heroku-apps/commit/a303f41))
* remove ./bin/run script ([2f7e4b0](https://github.com/heroku/heroku-apps/commit/2f7e4b0))
* updated mocha ([572b9ea](https://github.com/heroku/heroku-apps/commit/572b9ea))
* use new circle config ([761efa9](https://github.com/heroku/heroku-apps/commit/761efa9))

2.1.1 / 2016-05-20
==================

  * 2.1.1
  * updated heroku-cli-util

2.1.0 / 2016-05-20
==================

  * 2.1.0
  * updated actions to work with heroku-cli-util@6
  * updated deps
  * add img to dashboard
  * update action
  * filter dynos by type
  * update heroku-cli-util

2.0.7 / 2016-05-19
==================

  * 2.0.7
  * Add fix for 200 with { id: not_found } ([#96](https://github.com/heroku/heroku-apps/issues/96))
  * fix sortby
  * optimize co-wait require
  * Properly escape domains:wait example command ([#95](https://github.com/heroku/heroku-apps/issues/95))
  * update heroku-cli-util to 6
  * optimize requires
  * added benchmark script

2.0.6 / 2016-05-17
==================

  * 2.0.6
  * Merge branch 'master' of github.com:heroku/heroku-apps

2.0.5 / 2016-05-17
==================

  * 2.0.5
  * Add stable domains:add extra functionality ([#93](https://github.com/heroku/heroku-apps/issues/93))
    * Add stable domains:add extra functionality
    * refactor domain wait to use co-wait ([#94](https://github.com/heroku/heroku-apps/issues/94))
    * Remove unnecessary hasValue: false
  * Change free usage to be based off of account quota ([#90](https://github.com/heroku/heroku-apps/issues/90))
    * Change free usage to be based off of account quota
    * Respect free-2016 user flag to toggle behavior
  * circle test reporting
  * remove release_status variant ([#89](https://github.com/heroku/heroku-apps/issues/89))
  * changelog

2.0.4 / 2016-05-11
==================

  * 2.0.4
  * updated deps
  * preauth apps:info ([#88](https://github.com/heroku/heroku-apps/issues/88))
  * switch to codecov for coverage ([#87](https://github.com/heroku/heroku-apps/issues/87))
  * fix pipeline
  * less yellow
  * clean up color usage
  * standard 7ify
  * fix create specs
  * show done message

2.0.3 / 2016-04-25
==================

  * 2.0.3
  * hide stack on apps:create
  * show new app name
  * use os.homedir()
  * Update README.md
  * test config var shell format
  * standardify ([#83](https://github.com/heroku/heroku-apps/issues/83))
  * Fix snake case to camel case
  * Display release status ([#64](https://github.com/heroku/heroku-apps/issues/64))
    * show releases status in info and index
    * set max to 1 for retrieving current release

2.0.2 / 2016-04-22
==================

  * 2.0.2
  * Merge pull request [#82](https://github.com/heroku/heroku-apps/issues/82) from heroku/add-yes-command-line-flag
    Add yes command line flag

2.0.1 / 2016-04-21
==================

  * 2.0.1
  * switch back to ruby for `heroku apps`
    failing due to https://github.com/heroku/api/issues/5885
  * hide dynos and resize from topics
  * remove changelog from preversion
    since it would not show the latest release, changelog is better run
    afterwards manually
  * changelog
  * disable sparklines on windows

2.0.0 / 2016-04-21
==================

  * 2.0.0
  * set TZ for npm test
  * move stack commands to apps:stacks ([#77](https://github.com/heroku/heroku-apps/issues/77))
  * added dashboard and related commands ([#59](https://github.com/heroku/heroku-apps/issues/59))
  * apps list command ([#29](https://github.com/heroku/heroku-apps/issues/29))
    * apps command
    * added space and org options to apps:list
    * finalize apps index
    * Adding tests and slight wording modifications
    * fix name of function
    * filter spaces by org
    * added test for collab app test
    * show account name on apps list
    * testing apps index more
    * show only org apps with --org and --all
  * fixed output of ps:scale ([#74](https://github.com/heroku/heroku-apps/issues/74))
  * improve config:* UX ([#76](https://github.com/heroku/heroku-apps/issues/76))
    added release back in and use consistent colors
  * added releases:info ([#25](https://github.com/heroku/heroku-apps/issues/25))
    * releases
    * added test
    * better testing on releases index
    * added --shell to releases:info
    * fix current config vars
    * fix tests
  * fixpack
  * ignore codeclimate false positives
  * added ISC license
  * badging
  * fix coveralls
  * fix badges
  * code coverage
  * ignore coverage directory
  * codeclimate
  * fix build
  * ps:type ([#53](https://github.com/heroku/heroku-apps/issues/53))
    * ps:type
    * fix tests
    * simplify output
    * set cost to blank in case it is a new type
    * ignore coverage directory from jshint
  * update maintenance test to match dev center article
  * simplify npm test
  * ignore coverage directory from jshint
  * added test cases for config index ([#71](https://github.com/heroku/heroku-apps/issues/71))
  * added more testing on ps index ([#70](https://github.com/heroku/heroku-apps/issues/70))
    * added more testing on ps index
    * added more tests for ps:scale
  * testing labs commands ([#69](https://github.com/heroku/heroku-apps/issues/69))
  * testing updates ([#68](https://github.com/heroku/heroku-apps/issues/68))
    * use bluebird instead of bluebird-queue
    * testing keys:add
  * added labs test ([#67](https://github.com/heroku/heroku-apps/issues/67))
  * keys:* ([#40](https://github.com/heroku/heroku-apps/issues/40))
    * added keys cmd
    * added keys:*
    * added basic test for keys:add
    * inquirer 1.x
    * allow removing duplicate keys
    * move mkdirp to util
    * better testing on keys index
  * added changelog
  * added changelog ([#66](https://github.com/heroku/heroku-apps/issues/66))

1.8.0 / 2016-04-18
==================

  * 1.8.0
  * use cli.colors.app() ([#65](https://github.com/heroku/heroku-apps/issues/65))
    * use cli.colors.app()
    this is so it will work with the new app style output
    * updated deps
  * indent index
  * added ps:restart and ps:stop ([#51](https://github.com/heroku/heroku-apps/issues/51))
    * added ps:restart
    * added ps:stop
    * added app to ps:stop/restart
  * update heroku-cli-util
  * remove cyan from drain index
  * add pipeline to apps:info ([#58](https://github.com/heroku/heroku-apps/issues/58))
    * add pipeline to apps:info
    also cleaned up dogwood code a bit
    * update heroku-cli-util
    * added test
  * testing for more coverage ([#62](https://github.com/heroku/heroku-apps/issues/62))
    * testing stack:*
    * added test for apps:destroy
  * Merge pull request [#61](https://github.com/heroku/heroku-apps/issues/61) from heroku/coverage
    added code coverage
  * added code coverage
  * 1.7.3
  * hide aliased commands from `heroku help`

1.7.3 / 2016-03-30
==================

  * switch to circle
  * 1.7.2

1.7.2 / 2016-03-30
==================

  * Merge pull request [#57](https://github.com/heroku/heroku-apps/issues/57) from heroku/add-on-drains
    fix drains for add-on drains
  * simplify
  * styled json for log drains
  * fix drains for add-on drains
  * 1.7.1
  * added apps:rename
  * 1.7.0

1.7.0 / 2016-03-29
==================

  * 1.6.0

1.6.0 / 2016-03-24
==================

  * Merge pull request [#36](https://github.com/heroku/heroku-apps/issues/36) from heroku/apps-open
    added apps:open
  * added apps:open

1.5.2 / 2016-03-23
==================

  * 1.5.2
  * Merge pull request [#56](https://github.com/heroku/heroku-apps/issues/56) from heroku/spread-fix
    Remove the spread operator from labs / features
  * Remove the spread operator from labs / features
  * 1.5.1
  * added color to ps

1.5.1 / 2016-03-22
==================

  * added ps:scale
  * 1.5.0
  * remove duplicate maintenance command

1.5.0 / 2016-03-22
==================

  * Merge pull request [#50](https://github.com/heroku/heroku-apps/issues/50) from heroku/features
    features:*
  * added features:*
  * added features index
  * 1.4.0
  * 1.3.0
  * shorten releases header
  * update confirmation warning

1.4.0 / 2016-03-22
==================

  * Merge pull request [#31](https://github.com/heroku/heroku-apps/issues/31) from heroku/labs
    labs commands
