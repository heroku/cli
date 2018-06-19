# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="7.3.0"></a>
# [7.3.0](https://github.com/heroku/cli/compare/v7.2.0...v7.3.0) (2018-06-19)


### Bug Fixes

* add -j ([edf169a](https://github.com/heroku/cli/commit/edf169a))
* add -j flags ([b6890f4](https://github.com/heroku/cli/commit/b6890f4))
* add docs ([181d100](https://github.com/heroku/cli/commit/181d100))
* add recache hook ([dcc07e4](https://github.com/heroku/cli/commit/dcc07e4))
* add redirect uri ([7b72beb](https://github.com/heroku/cli/commit/7b72beb))
* added manifest to build ([f0c314b](https://github.com/heroku/cli/commit/f0c314b))
* added manifest to build ([1d63d75](https://github.com/heroku/cli/commit/1d63d75))
* bump dev-cli ([2dede94](https://github.com/heroku/cli/commit/2dede94))
* dev-cli updates ([68e9c2f](https://github.com/heroku/cli/commit/68e9c2f))
* fixed circle workflow name ([f66a597](https://github.com/heroku/cli/commit/f66a597))
* fixed example syntax ([1cce1d6](https://github.com/heroku/cli/commit/1cce1d6))
* fixed greenkeeper script ([d9c7c48](https://github.com/heroku/cli/commit/d9c7c48))
* fixed lint ([e317ee0](https://github.com/heroku/cli/commit/e317ee0))
* fixed release output when not tty ([e87bf30](https://github.com/heroku/cli/commit/e87bf30))
* fixed tests on non-tty ([aabe885](https://github.com/heroku/cli/commit/aabe885))
* help formatting fixes ([0ffb267](https://github.com/heroku/cli/commit/0ffb267))
* move 2fa:disable to auth plugin ([461a748](https://github.com/heroku/cli/commit/461a748))
* move 2fa:generate to auth plugin ([977e376](https://github.com/heroku/cli/commit/977e376))
* move standard to dev ([2888489](https://github.com/heroku/cli/commit/2888489))
* netrc-parser test mock ([2f7f217](https://github.com/heroku/cli/commit/2f7f217))
* new package name ([476640a](https://github.com/heroku/cli/commit/476640a))
* no longer using standard ([8119629](https://github.com/heroku/cli/commit/8119629))
* recache on config:set ([69c51cf](https://github.com/heroku/cli/commit/69c51cf))
* remove ./bin/run script ([f0b5a2a](https://github.com/heroku/cli/commit/f0b5a2a))
* remove auth:token ([ff8a907](https://github.com/heroku/cli/commit/ff8a907))
* remove co-wait ([dbd6cdf](https://github.com/heroku/cli/commit/dbd6cdf))
* remove config and config:get ([fc866f9](https://github.com/heroku/cli/commit/fc866f9))
* remove dependency on bluebird ([8d5aac4](https://github.com/heroku/cli/commit/8d5aac4))
* remove install from README ([752720e](https://github.com/heroku/cli/commit/752720e))
* remove mz, mkdirp, and string dependencies ([b8fe904](https://github.com/heroku/cli/commit/b8fe904))
* remove sudo ([84da1f2](https://github.com/heroku/cli/commit/84da1f2))
* set HEROKU_HIDE_HEXAGON ([b5ff87d](https://github.com/heroku/cli/commit/b5ff87d))
* show stack change in app info ([#232](https://github.com/heroku/cli/issues/232)) ([ee3fd37](https://github.com/heroku/cli/commit/ee3fd37))
* show the build stack in the stack command ([#231](https://github.com/heroku/cli/issues/231)) ([6d38977](https://github.com/heroku/cli/commit/6d38977))
* sort stacks ([e0f50c5](https://github.com/heroku/cli/commit/e0f50c5))
* update dev-cli ([7f76366](https://github.com/heroku/cli/commit/7f76366))
* update heroku-cli-util ([739246a](https://github.com/heroku/cli/commit/739246a))
* update heroku-cli-util ([9852ff8](https://github.com/heroku/cli/commit/9852ff8))
* update heroku-cli-util netrc multiline ([87f6080](https://github.com/heroku/cli/commit/87f6080))
* updated command ([80e1344](https://github.com/heroku/cli/commit/80e1344))
* updated heroku-cli-util ([d247128](https://github.com/heroku/cli/commit/d247128))
* updated mocha ([041d3ae](https://github.com/heroku/cli/commit/041d3ae))
* use new circle config ([7cac1c9](https://github.com/heroku/cli/commit/7cac1c9))
* whoami moved to [@heroku-cli](https://github.com/heroku-cli)/plugin-auth ([acad435](https://github.com/heroku/cli/commit/acad435))


### Features

* Add a `--manifest` option for beta users to support heroku.yml files. ([#228](https://github.com/heroku/cli/issues/228)) ([b12d975](https://github.com/heroku/cli/commit/b12d975))
* iwa: Add --internal-routing flag for app creation ([#235](https://github.com/heroku/cli/issues/235)) ([dadb992](https://github.com/heroku/cli/commit/dadb992))




<a name="7.2.0"></a>
# [7.2.0](https://github.com/heroku/cli/compare/v7.1.1...v7.2.0) (2018-06-19)


### Bug Fixes

* add recache hooks to login/logout ([e7e210f](https://github.com/heroku/cli/commit/e7e210f))
* added typings ([689a923](https://github.com/heroku/cli/commit/689a923))
* do not retryAuth when fetching email ([4fa83d0](https://github.com/heroku/cli/commit/4fa83d0))
* do not retryAuth when fetching email ([28c7987](https://github.com/heroku/cli/commit/28c7987))
* duplicate warning ([bf1e39d](https://github.com/heroku/cli/commit/bf1e39d))
* ensure latest cli-ux ([ba13a10](https://github.com/heroku/cli/commit/ba13a10))
* fixed tests when logged out ([bbc12e3](https://github.com/heroku/cli/commit/bbc12e3))
* **auth:** added prepare step ([e2e7ad4](https://github.com/heroku/cli/commit/e2e7ad4))
* **auth:** heroku-cli-plugin-auth -> auth ([e06685c](https://github.com/heroku/cli/commit/e06685c))
* remove heroku-cli-util ([ff5ecdd](https://github.com/heroku/cli/commit/ff5ecdd))
* **auth:** updated deps ([94c2947](https://github.com/heroku/cli/commit/94c2947))
* output tweak ([c0534b5](https://github.com/heroku/cli/commit/c0534b5))
* remove docs ([09e03e4](https://github.com/heroku/cli/commit/09e03e4))
* removed unneeded period ([5f4a79f](https://github.com/heroku/cli/commit/5f4a79f))
* set bin ([4aa19d5](https://github.com/heroku/cli/commit/4aa19d5))
* tests ([30c217d](https://github.com/heroku/cli/commit/30c217d))
* updated command ([949f6ea](https://github.com/heroku/cli/commit/949f6ea))
* updated deps ([95750f2](https://github.com/heroku/cli/commit/95750f2))
* updated deps ([1494f72](https://github.com/heroku/cli/commit/1494f72))
* use semver for deps ([f374f3b](https://github.com/heroku/cli/commit/f374f3b))


### Features

* added -s and -i flags to login ([f24a875](https://github.com/heroku/cli/commit/f24a875))
* added 2fa:index ([f1ac034](https://github.com/heroku/cli/commit/f1ac034))
* added auth:2fa:disable ([7a5df4a](https://github.com/heroku/cli/commit/7a5df4a))
* added auth:2fa:generate-recovery-codes ([f0ca1d9](https://github.com/heroku/cli/commit/f0ca1d9))
* added auth:token ([4f8ee5f](https://github.com/heroku/cli/commit/4f8ee5f))
* added auth:whoami ([46c3a54](https://github.com/heroku/cli/commit/46c3a54))
* added labs:disable ([e4a3199](https://github.com/heroku/cli/commit/e4a3199))
* added login/logout commands ([89032cb](https://github.com/heroku/cli/commit/89032cb))




<a name="7.1.0"></a>
# [7.1.0](https://github.com/heroku/cli/compare/v7.0.100...v7.1.0) (2018-06-19)


### Bug Fixes

* add config to deps ([74ccac7](https://github.com/heroku/cli/commit/74ccac7))
* add errors to deps ([07185ad](https://github.com/heroku/cli/commit/07185ad))
* added preversion step ([b69ea59](https://github.com/heroku/cli/commit/b69ea59))
* added preversion step ([a2482ef](https://github.com/heroku/cli/commit/a2482ef))
* bump dev-cli ([7b0af2f](https://github.com/heroku/cli/commit/7b0af2f))
* color tweaks ([e2a9d8b](https://github.com/heroku/cli/commit/e2a9d8b))
* correct package name ([af81086](https://github.com/heroku/cli/commit/af81086))
* detect ssh public key errors and give some debugging information ([#44](https://github.com/heroku/cli/issues/44)) ([9810ca3](https://github.com/heroku/cli/commit/9810ca3))
* disable notification sound for now ([a9eb88f](https://github.com/heroku/cli/commit/a9eb88f))
* empty log lines ([bb427a3](https://github.com/heroku/cli/commit/bb427a3))
* EPIPE is not a failing condition ([d860181](https://github.com/heroku/cli/commit/d860181))
* example docs ([f9a948b](https://github.com/heroku/cli/commit/f9a948b))
* finished anycli conversion ([da3180e](https://github.com/heroku/cli/commit/da3180e))
* fix process substitution hanging ([1956716](https://github.com/heroku/cli/commit/1956716))
* fixed CI build ([852f277](https://github.com/heroku/cli/commit/852f277))
* fixed topics ([1a33388](https://github.com/heroku/cli/commit/1a33388))
* move to [@heroku-cli](https://github.com/heroku-cli)/command ([34f2f21](https://github.com/heroku/cli/commit/34f2f21))
* oclif rename ([393179d](https://github.com/heroku/cli/commit/393179d))
* oclif rename ([2a45fda](https://github.com/heroku/cli/commit/2a45fda))
* only prune carriage returns if not tty ([7998194](https://github.com/heroku/cli/commit/7998194))
* private spaces with -x flag ([380ee58](https://github.com/heroku/cli/commit/380ee58))
* release fixes ([2ee3ac1](https://github.com/heroku/cli/commit/2ee3ac1))
* remove bin attribute ([f3235e1](https://github.com/heroku/cli/commit/f3235e1))
* remove bin/run test ([06d1389](https://github.com/heroku/cli/commit/06d1389))
* **run:** clarified help on --dyno and --source ([6e4c54b](https://github.com/heroku/cli/commit/6e4c54b))
* remove commitlint ([02d7566](https://github.com/heroku/cli/commit/02d7566))
* updated config ([d562246](https://github.com/heroku/cli/commit/d562246))
* updated deps ([93b4132](https://github.com/heroku/cli/commit/93b4132))
* updated deps ([371f2b6](https://github.com/heroku/cli/commit/371f2b6))
* updated deps ([ef95ca8](https://github.com/heroku/cli/commit/ef95ca8))
* updated deps ([8136d2f](https://github.com/heroku/cli/commit/8136d2f))
* updated dev deps ([ab9d18b](https://github.com/heroku/cli/commit/ab9d18b))
* use CLIError for git error ([8cc4faa](https://github.com/heroku/cli/commit/8cc4faa))
* use proxy for evented logs ([c5949b8](https://github.com/heroku/cli/commit/c5949b8))


### Features

* added apache colorized logs ([aff11d5](https://github.com/heroku/cli/commit/aff11d5))
* colorizing work ([c9ab8c6](https://github.com/heroku/cli/commit/c9ab8c6))
* notification if dyno takes longer than 20 seconds to start ([#45](https://github.com/heroku/cli/issues/45)) ([b8246ed](https://github.com/heroku/cli/commit/b8246ed))



<a name="7.0.100"></a>
## [7.0.100](https://github.com/heroku/cli/compare/v7.0.99...v7.0.100) (2018-06-18)
