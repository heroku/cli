# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.58.0](https://github.com/heroku/cli/compare/v7.57.0...v7.58.0) (2021-08-24)


### Features

* **pg-v5:** Add pg:settings:track-functions ([#1854](https://github.com/heroku/cli/issues/1854)) ([68a4cf7](https://github.com/heroku/cli/commit/68a4cf7d759eceee012ff56b4ac26710ab0c025b))





## [7.56.1](https://github.com/heroku/cli/compare/v7.56.0...v7.56.1) (2021-07-12)


### Bug Fixes

* **pg-v5:** add an environment variable for which addon service to resolve ([40d212d](https://github.com/heroku/cli/commit/40d212d98ecce4b9c918735b711104862a04b263))





# [7.54.0](https://github.com/heroku/cli/compare/v7.47.10...v7.54.0) (2021-05-18)


### Bug Fixes

* **pg-v5:** remove co-wait ([85ea0c2](https://github.com/heroku/cli/commit/85ea0c2c9113b0b53c87d6925b5fb3e8220a7f74))


### Features

* **pg-v5:** add burst checks, json output to diagnose ([c9c6f97](https://github.com/heroku/cli/commit/c9c6f979680bf79ea5dd1bf3cdfdde41b6da702b))





## [7.53.1](https://github.com/heroku/cli/compare/v7.53.0...v7.53.1) (2021-05-05)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.53.0](https://github.com/heroku/cli/compare/v7.52.0...v7.53.0) (2021-04-27)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





## [7.49.1](https://github.com/heroku/cli/compare/v7.49.0...v7.49.1) (2021-02-26)


### Bug Fixes

* **pg-v5:** remove co-wait ([85ea0c2](https://github.com/heroku/cli/commit/85ea0c2c9113b0b53c87d6925b5fb3e8220a7f74))





# [7.49.0](https://github.com/heroku/cli/compare/v7.47.13...v7.49.0) (2021-02-24)


### Features

* **pg-v5:** add burst checks, json output to diagnose ([c9c6f97](https://github.com/heroku/cli/commit/c9c6f979680bf79ea5dd1bf3cdfdde41b6da702b))





# [7.48.0](https://github.com/heroku/cli/compare/v7.47.13...v7.48.0) (2021-02-22)


### Features

* **pg-v5:** add burst checks, json output to diagnose ([c9c6f97](https://github.com/heroku/cli/commit/c9c6f979680bf79ea5dd1bf3cdfdde41b6da702b))





## [7.47.13](https://github.com/heroku/cli/compare/v7.47.12...v7.47.13) (2021-02-18)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





## [7.47.10](https://github.com/heroku/cli/compare/v7.47.7...v7.47.10) (2021-01-21)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





## [7.47.9](https://github.com/heroku/cli/compare/v7.47.7...v7.47.9) (2021-01-21)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





## [7.47.8](https://github.com/heroku/cli/compare/v7.47.2...v7.47.8) (2021-01-19)


### Bug Fixes

* **pg:** Remove SIGINT capture and allow default node clean up ([#1687](https://github.com/heroku/cli/issues/1687)) ([2b278f0](https://github.com/heroku/cli/commit/2b278f0bbda3664d92de38656d76ab4dfef97e1b))
* **pg-v5:** ensure ssh tunnel properly gets cleaned up ([6eb7962](https://github.com/heroku/cli/commit/6eb7962281016099d372db312e1e92a6109135db))
* **pg-v5:** once returns array of arguments, add test ([67bfa61](https://github.com/heroku/cli/commit/67bfa61faf351534d1f837bc372d0984140fc972))
* **pg-v5:** return child process stdout ([#1701](https://github.com/heroku/cli/issues/1701)) ([7f86c49](https://github.com/heroku/cli/commit/7f86c49df77dfed6bfe4297b59a6f939385dc151)), closes [#1691](https://github.com/heroku/cli/issues/1691) [#1691](https://github.com/heroku/cli/issues/1691) [/github.com/heroku/cli/blob/729acd6382b424649c51bff7f4afb02df99d46ac/packages/pg-v5/commands/ps.js#L27](https://github.com//github.com/heroku/cli/blob/729acd6382b424649c51bff7f4afb02df99d46ac/packages/pg-v5/commands/ps.js/issues/L27)
* **pg-v5:** Running diagnose on not default DBs ([#1680](https://github.com/heroku/cli/issues/1680)) ([0af72b7](https://github.com/heroku/cli/commit/0af72b7b2929689b5f35b43a09690890443d97c0))





## [7.47.6](https://github.com/heroku/cli/compare/v7.47.5...v7.47.6) (2020-12-16)


### Bug Fixes

* **pg-v5:** return child process stdout ([#1701](https://github.com/heroku/cli/issues/1701)) ([7f86c49](https://github.com/heroku/cli/commit/7f86c49df77dfed6bfe4297b59a6f939385dc151)), closes [#1691](https://github.com/heroku/cli/issues/1691) [#1691](https://github.com/heroku/cli/issues/1691) [/github.com/heroku/cli/blob/729acd6382b424649c51bff7f4afb02df99d46ac/packages/pg-v5/commands/ps.js#L27](https://github.com//github.com/heroku/cli/blob/729acd6382b424649c51bff7f4afb02df99d46ac/packages/pg-v5/commands/ps.js/issues/L27)





## [7.47.5](https://github.com/heroku/cli/compare/v7.47.4...v7.47.5) (2020-12-10)


### Bug Fixes

* **pg-v5:** ensure ssh tunnel properly gets cleaned up ([6eb7962](https://github.com/heroku/cli/commit/6eb7962281016099d372db312e1e92a6109135db))
* **pg-v5:** once returns array of arguments, add test ([67bfa61](https://github.com/heroku/cli/commit/67bfa61faf351534d1f837bc372d0984140fc972))





## [7.47.4](https://github.com/heroku/cli/compare/v7.47.3...v7.47.4) (2020-12-01)


### Bug Fixes

* **pg:** Remove SIGINT capture and allow default node clean up ([#1687](https://github.com/heroku/cli/issues/1687)) ([2b278f0](https://github.com/heroku/cli/commit/2b278f0bbda3664d92de38656d76ab4dfef97e1b))





## [7.47.3](https://github.com/heroku/cli/compare/v7.47.2...v7.47.3) (2020-11-18)


### Bug Fixes

* **pg-v5:** Running diagnose on not default DBs ([#1680](https://github.com/heroku/cli/issues/1680)) ([0af72b7](https://github.com/heroku/cli/commit/0af72b7b2929689b5f35b43a09690890443d97c0))





## [7.43.3](https://github.com/heroku/cli/compare/v7.43.2...v7.43.3) (2020-09-29)


### Bug Fixes

* **pg-v5:** exclude the internal _heroku schema from pg dump ([#1648](https://github.com/heroku/cli/issues/1648)) ([c4e390c](https://github.com/heroku/cli/commit/c4e390c98f7dde3903d43ba2f185fa729f2b4633))





## [7.42.12](https://github.com/heroku/cli/compare/v7.42.11...v7.42.12) (2020-08-26)


### Bug Fixes

* bump cross-env from 5.2.0 to 7.0.2 ([#1597](https://github.com/heroku/cli/issues/1597)) ([33b2aba](https://github.com/heroku/cli/commit/33b2aba842993053f035e732871e19f2a35156a8))





## [7.42.2](https://github.com/heroku/cli/compare/v7.42.1...v7.42.2) (2020-06-22)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.41.0](https://github.com/heroku/cli/compare/v7.40.0...v7.41.0) (2020-05-11)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.40.0](https://github.com/heroku/cli/compare/v7.39.6...v7.40.0) (2020-05-01)


### Features

* **pg-v5:** support overriding the postgres hobby tier host ([#1372](https://github.com/heroku/cli/issues/1372)) ([c815b4f](https://github.com/heroku/cli/commit/c815b4fdb7c1488ea643cb8bad1e791e77336b69))





## [7.39.6](https://github.com/heroku/cli/compare/v7.39.5...v7.39.6) (2020-05-01)


### Bug Fixes

* **pg-v5:** dropbox regex ([#1399](https://github.com/heroku/cli/issues/1399)) ([9a6c7ab](https://github.com/heroku/cli/commit/9a6c7ab0e55f089d9ecf9f85ea34ac18d51de89f))





## [7.39.2](https://github.com/heroku/cli/compare/v7.39.1...v7.39.2) (2020-03-30)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.37.0](https://github.com/heroku/cli/compare/v7.36.3...v7.37.0) (2020-01-25)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.36.0](https://github.com/heroku/cli/compare/v7.35.1...v7.36.0) (2020-01-20)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





# [7.34.0](https://github.com/heroku/cli/compare/v7.33.3...v7.34.0) (2019-11-05)


### Features

* **pg-v5:** Add exposed pg:setting for toggling logging on connection attempts ([#1320](https://github.com/heroku/cli/issues/1320)) ([411caa9](https://github.com/heroku/cli/commit/411caa9))





# [7.31.0](https://github.com/heroku/cli/compare/v7.30.1...v7.31.0) (2019-09-30)


### Bug Fixes

* **pg-v5:** hide pg:repoint with warning ([#1335](https://github.com/heroku/cli/issues/1335)) ([15dbaa4](https://github.com/heroku/cli/commit/15dbaa4))





## [7.30.1](https://github.com/heroku/cli/compare/v7.30.0...v7.30.1) (2019-09-24)


### Bug Fixes

* **pg-v5:** exec psql with set sslmode=require ([#1331](https://github.com/heroku/cli/issues/1331)) ([3bce4bc](https://github.com/heroku/cli/commit/3bce4bc))





<a name="7.28.0"></a>
# [7.28.0](https://github.com/heroku/cli/compare/v7.27.1...v7.28.0) (2019-08-19)


### Bug Fixes

* **pg:backups:schedules:** don't throw error when there are no… ([#1281](https://github.com/heroku/cli/issues/1281)) ([cffaafd](https://github.com/heroku/cli/commit/cffaafd))




<a name="7.16.2"></a>
## [7.16.2](https://github.com/heroku/cli/compare/v7.16.1...v7.16.2) (2018-10-02)


### Bug Fixes

* updated deps ([482dc85](https://github.com/heroku/cli/commit/482dc85))





<a name="7.16.0"></a>
# [7.16.0](https://github.com/heroku/cli/compare/v7.15.2...v7.16.0) (2018-09-14)


### Bug Fixes

* updated deps ([6d3be5a](https://github.com/heroku/cli/commit/6d3be5a))
* updated dev-cli ([022396b](https://github.com/heroku/cli/commit/022396b))





<a name="7.15.0"></a>
# [7.15.0](https://github.com/heroku/cli/compare/v7.14.4...v7.15.0) (2018-09-10)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





<a name="7.12.6"></a>
## [7.12.6](https://github.com/heroku/cli/compare/v7.12.5...v7.12.6) (2018-08-30)


### Bug Fixes

* windows test failures ([5b4d171](https://github.com/heroku/cli/commit/5b4d171))





<a name="7.12.4"></a>
## [7.12.4](https://github.com/heroku/cli/compare/v7.12.3...v7.12.4) (2018-08-29)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





<a name="7.9.4"></a>
## [7.9.4](https://github.com/heroku/cli/compare/v7.9.3...v7.9.4) (2018-08-21)


### Bug Fixes

* updated notifier ([85ad480](https://github.com/heroku/cli/commit/85ad480))





<a name="7.9.3"></a>
## [7.9.3](https://github.com/heroku/cli/compare/v7.9.2...v7.9.3) (2018-08-18)

**Note:** Version bump only for package @heroku-cli/plugin-pg-v5





<a name="7.9.2"></a>
## [7.9.2](https://github.com/heroku/cli/compare/v7.9.1...v7.9.2) (2018-08-18)


### Bug Fixes

* typescript 3.0 ([268c0af](https://github.com/heroku/cli/commit/268c0af))
* **pg:** Warn that force-rotating creds may impact access to followers ([#984](https://github.com/heroku/cli/issues/984)) ([01b756f](https://github.com/heroku/cli/commit/01b756f))





<a name="7.9.1"></a>
## [7.9.1](https://github.com/heroku/cli/compare/v7.9.0...v7.9.1) (2018-08-17)


### Bug Fixes

* updated some dependencies ([0306f88](https://github.com/heroku/cli/commit/0306f88))




<a name="7.7.2"></a>
## [7.7.2](https://github.com/heroku/cli/compare/v7.7.1...v7.7.2) (2018-07-18)


### Bug Fixes

* **pg:** changes 'force' to 'forced' ([#945](https://github.com/heroku/cli/issues/945)) ([2183c90](https://github.com/heroku/cli/commit/2183c90))




<a name="7.5.6"></a>
## [7.5.6](https://github.com/heroku/cli/compare/v7.5.5...v7.5.6) (2018-06-29)


### Bug Fixes

* bump legacy and color ([a3fa970](https://github.com/heroku/cli/commit/a3fa970))




<a name="7.5.5"></a>
## [7.5.5](https://github.com/heroku/cli/compare/v7.5.4...v7.5.5) (2018-06-29)




**Note:** Version bump only for package @heroku-cli/plugin-pg-v5

<a name="7.5.1"></a>
## [7.5.1](https://github.com/heroku/cli/compare/v7.5.0...v7.5.1) (2018-06-26)


### Bug Fixes

* bump dev-cli ([fb3e41a](https://github.com/heroku/cli/commit/fb3e41a))




<a name="7.5.0"></a>
# [7.5.0](https://github.com/heroku/cli/compare/v7.4.11...v7.5.0) (2018-06-26)




**Note:** Version bump only for package @heroku-cli/plugin-pg-v5

<a name="7.4.8"></a>
## [7.4.8](https://github.com/heroku/cli/compare/v7.4.7...v7.4.8) (2018-06-21)




**Note:** Version bump only for package @heroku-cli/plugin-pg-v5

<a name="7.4.6"></a>
## [7.4.6](https://github.com/heroku/cli/compare/v7.4.5...v7.4.6) (2018-06-20)


### Bug Fixes

* update dev-cli readme generation ([42a77bc](https://github.com/heroku/cli/commit/42a77bc))




<a name="7.4.5"></a>
## [7.4.5](https://github.com/heroku/cli/compare/v7.4.4...v7.4.5) (2018-06-20)


### Bug Fixes

* updated monorepo documentation urls ([4bb6fe0](https://github.com/heroku/cli/commit/4bb6fe0))




<a name="7.4.0"></a>
# [7.4.0](https://github.com/heroku/cli/compare/v7.3.0...v7.4.0) (2018-06-19)


### Bug Fixes

* repo name ([c306c78](https://github.com/heroku/cli/commit/c306c78))
