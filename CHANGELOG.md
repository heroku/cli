# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.0.3-alpha.3](https://github.com/heroku/cli/compare/v10.0.2...v10.0.3-alpha.0) (2025-01-30)


### Bug Fixes

* send correct value to api for grpc telemetry drains ([#3178](https://github.com/heroku/cli/issues/3178)) ([48b7f8a](https://github.com/heroku/cli/commit/48b7f8ad341f0bad7136c35ae840b1249aecd805))
* Unable to list drains for a space in fir ([#3170](https://github.com/heroku/cli/issues/3170)) ([1ee8f62](https://github.com/heroku/cli/commit/1ee8f625acf586096f6f609926656a4cb046481a))





## [10.0.2](https://github.com/heroku/cli/compare/v10.0.1...v10.0.2) (2025-01-09)


### Bug Fixes

* pipeline diff fails on v10 ([#3154](https://github.com/heroku/cli/issues/3154)) ([acb4b76](https://github.com/heroku/cli/commit/acb4b765ac32a698d145cac20c2afbf2f187e7e0))
* **W-17568149:** pg:settings:log-min-duration-statement command is submitting a string instead of number ([#3167](https://github.com/heroku/cli/issues/3167)) ([d645f0e](https://github.com/heroku/cli/commit/d645f0e65394ac9508490cc7ffae613681e120be))





## [10.0.1](https://github.com/heroku/cli/compare/v10.0.0...v10.0.1) (2025-01-07)


### Bug Fixes

* apps:rename and apps:destroy incorrectly handles git remotes ([#3110](https://github.com/heroku/cli/issues/3110)) ([9290130](https://github.com/heroku/cli/commit/9290130143207c8ab7e14f5d96e05506f88d45fc))
* update versions of http-call, heroku-cli/command, and ps-exec ([#3161](https://github.com/heroku/cli/issues/3161)) ([29b9580](https://github.com/heroku/cli/commit/29b9580fba59956e4818abe30cbc28516def0c8a))




# [10.0.0](https://github.com/heroku/cli/compare/v9.5.1...v10.0.0) (2024-12-09)


### Features

* **cli:** Add Fir support to 'pipelines:diff' ([#3093](https://github.com/heroku/cli/issues/3093)) ([60b509d](https://github.com/heroku/cli/commit/60b509dc062733699e891debb14a0d7c6b8f8621))
* upgrade ps-exec to v2.6.0 ([e3670a0](https://github.com/heroku/cli/commit/e3670a07d855dea6800416a472aaad5aa90dc758))
* add fir-specific error message for autoscale:enable ([#3069](https://github.com/heroku/cli/issues/3069)) ([19a222f](https://github.com/heroku/cli/commit/19a222fe88fc9a489f1f35a2f4060fb0fc513420))
* update plugin-ps-exec to latest beta ([#3087](https://github.com/heroku/cli/issues/3087)) ([6d4b2a4](https://github.com/heroku/cli/commit/6d4b2a4d29165fda015b527d2bf59069551e53cd))
* add basic flags, logic, and tests for telemetry:add ([adeb986](https://github.com/heroku/cli/commit/adeb98613886789a6b818e80f126da66ec43fbf8))
* add endpoint and transport flags to telemetry:add ([a32765d](https://github.com/heroku/cli/commit/a32765d5481aa0a2d15eb2ac6aa72a08381253e8))
* add generation column to spaces command ([#3029](https://github.com/heroku/cli/issues/3029)) ([79c17fa](https://github.com/heroku/cli/commit/79c17fa06fac52ac1f790e7851928233ff4ea937))
* add generation column to spaces renderInfo command ([bec18a8](https://github.com/heroku/cli/commit/bec18a811df89a36420b2a83e46d83f16e1e715e))
* Add telemetry index command to list telemetry drains ([#3031](https://github.com/heroku/cli/issues/3031)) ([e51affb](https://github.com/heroku/cli/commit/e51affbcca6ec6f5e7f628397f294126b0c4f03b))
* **cli:** Update node version to 20 ([#2989](https://github.com/heroku/cli/issues/2989)) ([fece1bc](https://github.com/heroku/cli/commit/fece1bc105d46f3b3969bd524f74854112b17b99))
* **cli:** Updates to `logs` command for Fir ([#3046](https://github.com/heroku/cli/issues/3046)) ([3f7d253](https://github.com/heroku/cli/commit/3f7d253ab525d79a12bf484fabcadc53e5b1fb29))
* separate calls for app and space drains and update tests ([2005912](https://github.com/heroku/cli/commit/2005912516d69e59d9469a7578f7ab5b55f44090))
* update spaces:info and spaces:wait to use fir API ([a087692](https://github.com/heroku/cli/commit/a087692894595522384773737f3a5d958e346ac5))
* **cli:** Add Fir support to 'pipelines:diff' ([#3093](https://github.com/heroku/cli/issues/3093)) ([60b509d](https://github.com/heroku/cli/commit/60b509dc062733699e891debb14a0d7c6b8f8621))
* upgrade ps-exec to v2.6.0 ([e3670a0](https://github.com/heroku/cli/commit/e3670a07d855dea6800416a472aaad5aa90dc758))
* add fir-specific error message for autoscale:enable ([#3069](https://github.com/heroku/cli/issues/3069)) ([19a222f](https://github.com/heroku/cli/commit/19a222fe88fc9a489f1f35a2f4060fb0fc513420))
* update plugin-ps-exec to latest beta ([#3087](https://github.com/heroku/cli/issues/3087)) ([6d4b2a4](https://github.com/heroku/cli/commit/6d4b2a4d29165fda015b527d2bf59069551e53cd))
* add basic flags, logic, and tests for telemetry:add ([adeb986](https://github.com/heroku/cli/commit/adeb98613886789a6b818e80f126da66ec43fbf8))
* add endpoint and transport flags to telemetry:add ([a32765d](https://github.com/heroku/cli/commit/a32765d5481aa0a2d15eb2ac6aa72a08381253e8))
* add generation column to spaces command ([#3029](https://github.com/heroku/cli/issues/3029)) ([79c17fa](https://github.com/heroku/cli/commit/79c17fa06fac52ac1f790e7851928233ff4ea937))
* add generation column to spaces renderInfo command ([bec18a8](https://github.com/heroku/cli/commit/bec18a811df89a36420b2a83e46d83f16e1e715e))
* Add telemetry index command to list telemetry drains ([#3031](https://github.com/heroku/cli/issues/3031)) ([e51affb](https://github.com/heroku/cli/commit/e51affbcca6ec6f5e7f628397f294126b0c4f03b))
* **cli:** Update node version to 20 ([#2989](https://github.com/heroku/cli/issues/2989)) ([fece1bc](https://github.com/heroku/cli/commit/fece1bc105d46f3b3969bd524f74854112b17b99))
* **cli:** Updates to `logs` command for Fir ([#3046](https://github.com/heroku/cli/issues/3046)) ([3f7d253](https://github.com/heroku/cli/commit/3f7d253ab525d79a12bf484fabcadc53e5b1fb29))
* separate calls for app and space drains and update tests ([2005912](https://github.com/heroku/cli/commit/2005912516d69e59d9469a7578f7ab5b55f44090))
* update spaces:info and spaces:wait to use fir API ([a087692](https://github.com/heroku/cli/commit/a087692894595522384773737f3a5d958e346ac5))
* **cli:** Adding disclaimer for plugin AI install ([#3065](https://github.com/heroku/cli/issues/3065)) ([80ab352](https://github.com/heroku/cli/commit/80ab352a5b68e96dba6d5a0ed900f6e1c166d98f))
* add basic flags, logic, and tests for telemetry:add ([adeb986](https://github.com/heroku/cli/commit/adeb98613886789a6b818e80f126da66ec43fbf8))
* add endpoint and transport flags to telemetry:add ([a32765d](https://github.com/heroku/cli/commit/a32765d5481aa0a2d15eb2ac6aa72a08381253e8))
* add generation column to spaces command ([#3029](https://github.com/heroku/cli/issues/3029)) ([79c17fa](https://github.com/heroku/cli/commit/79c17fa06fac52ac1f790e7851928233ff4ea937))
* add generation column to spaces renderInfo command ([bec18a8](https://github.com/heroku/cli/commit/bec18a811df89a36420b2a83e46d83f16e1e715e))
* Add telemetry index command to list telemetry drains ([#3031](https://github.com/heroku/cli/issues/3031)) ([e51affb](https://github.com/heroku/cli/commit/e51affbcca6ec6f5e7f628397f294126b0c4f03b))
* **cli:** Update node version to 20 ([#2989](https://github.com/heroku/cli/issues/2989)) ([fece1bc](https://github.com/heroku/cli/commit/fece1bc105d46f3b3969bd524f74854112b17b99))
* **cli:** Updates to `logs` command for Fir ([#3046](https://github.com/heroku/cli/issues/3046)) ([3f7d253](https://github.com/heroku/cli/commit/3f7d253ab525d79a12bf484fabcadc53e5b1fb29))
* separate calls for app and space drains and update tests ([2005912](https://github.com/heroku/cli/commit/2005912516d69e59d9469a7578f7ab5b55f44090))
* update spaces:info and spaces:wait to use fir API ([a087692](https://github.com/heroku/cli/commit/a087692894595522384773737f3a5d958e346ac5))




### Bug Fixes

* bug with telemetry:add ([#3094](https://github.com/heroku/cli/issues/3094)) ([df31ab2](https://github.com/heroku/cli/commit/df31ab2d729fa1f9908f5098a78482d8d37f0bc4))
* only print slug size for apps:info for non-fir apps ([#3129](https://github.com/heroku/cli/issues/3129)) ([91b48f2](https://github.com/heroku/cli/commit/91b48f2f5e01fa3cc58ac2c58ec0adae7ac1b480))
* run:inside hangs (doesn't error) when no/invalid SSH key ([#3130](https://github.com/heroku/cli/issues/3130)) ([b44fcf8](https://github.com/heroku/cli/commit/b44fcf813ccd0f32d75bdaf9648670b1bb89c512))
* show only generation name in spaces:info output ([#3128](https://github.com/heroku/cli/issues/3128)) ([48c5b8e](https://github.com/heroku/cli/commit/48c5b8ee7d9264109128ddbb08efac9164c08db9))
* bug with telemetry:add ([#3094](https://github.com/heroku/cli/issues/3094)) ([df31ab2](https://github.com/heroku/cli/commit/df31ab2d729fa1f9908f5098a78482d8d37f0bc4))
* only print slug size for apps:info for non-fir apps ([#3129](https://github.com/heroku/cli/issues/3129)) ([91b48f2](https://github.com/heroku/cli/commit/91b48f2f5e01fa3cc58ac2c58ec0adae7ac1b480))
* run:inside hangs (doesn't error) when no/invalid SSH key ([#3130](https://github.com/heroku/cli/issues/3130)) ([b44fcf8](https://github.com/heroku/cli/commit/b44fcf813ccd0f32d75bdaf9648670b1bb89c512))
* show only generation name in spaces:info output ([#3128](https://github.com/heroku/cli/issues/3128)) ([48c5b8e](https://github.com/heroku/cli/commit/48c5b8ee7d9264109128ddbb08efac9164c08db9))




## [9.5.1](https://github.com/heroku/cli/compare/v9.5.0...v9.5.1) (2024-12-05)


### Bug Fixes

* **git:remote:** update example text to reflect staging app ([#3095](https://github.com/heroku/cli/issues/3095)) ([d4ce1ba](https://github.com/heroku/cli/commit/d4ce1ba422539a8a6a029eca4413700535327785))





# [9.5.0](https://github.com/heroku/cli/compare/v9.4.0...v9.5.0) (2024-11-13)


### Features

* **addons:** add inference disclaimer ([#3076](https://github.com/heroku/cli/issues/3076)) ([6d33a56](https://github.com/heroku/cli/commit/6d33a5653df971680826d7b6006932a5920a4b93))





# [9.4.0](https://github.com/heroku/cli/compare/v9.3.2...v9.4.0) (2024-11-11)


### Bug Fixes

* access command error handling ([#3077](https://github.com/heroku/cli/issues/3077)) ([79188e5](https://github.com/heroku/cli/commit/79188e571b3b7cdbca85ce9012be92a93938dee3))


### Features

* add fir-specific error message for autoscale:enable ([#3069](https://github.com/heroku/cli/issues/3069)) ([19a222f](https://github.com/heroku/cli/commit/19a222fe88fc9a489f1f35a2f4060fb0fc513420))
* update plugin-ps-exec to latest beta ([#3087](https://github.com/heroku/cli/issues/3087)) ([6d4b2a4](https://github.com/heroku/cli/commit/6d4b2a4d29165fda015b527d2bf59069551e53cd))





## [9.3.2](https://github.com/heroku/cli/compare/v9.3.1...v9.3.2) (2024-10-23)

**Note:** Version bump only for package heroku





## [9.3.1](https://github.com/heroku/cli/compare/v9.3.0...v9.3.1) (2024-10-14)


### Bug Fixes

* **run:** update args parsing logic ([#3030](https://github.com/heroku/cli/issues/3030)) ([6850e65](https://github.com/heroku/cli/commit/6850e655626fe9ce18d2a6c074e3518186cbe794))





# [9.3.0](https://github.com/heroku/cli/compare/v9.2.1...v9.3.0) (2024-09-24)

**Note:** Version bump only for package heroku





## [9.2.2](https://github.com/heroku/cli/compare/v9.2.1...v9.2.2) (2024-09-24)

**Note:** Version bump only for package heroku





## [9.2.1](https://github.com/heroku/cli/compare/v9.2.0...v9.2.1) (2024-09-05)

**Note:** Version bump only for package heroku





# [9.2.0](https://github.com/heroku/cli/compare/v9.1.0...v9.2.0) (2024-08-26)


### Bug Fixes

* change type of value to string for log-min-duration ([#2977](https://github.com/heroku/cli/issues/2977)) ([3224705](https://github.com/heroku/cli/commit/322470531f0b806395c217d35c9524d6694387fb))
* **cli:** fix missing dockerfile error ([#2988](https://github.com/heroku/cli/issues/2988)) ([1f880e8](https://github.com/heroku/cli/commit/1f880e85b6fe27c29672a959d93df0d1e3e8b05a))
* **cli:** Update app and remote flags ([#2968](https://github.com/heroku/cli/issues/2968)) ([6b57765](https://github.com/heroku/cli/commit/6b577651e4f6b667f15e637cd080143b846c7eaf))
* **pg:** Restoring behavior for backup scheduling ([#2981](https://github.com/heroku/cli/issues/2981)) ([bfac653](https://github.com/heroku/cli/commit/bfac6538617085d82e351227c68853d324b6b4a0))
* **redis:cli:** remove call to resolve ssh2 in bastionConnect function ([#2980](https://github.com/heroku/cli/issues/2980)) ([d11c18f](https://github.com/heroku/cli/commit/d11c18fbd9f26208eb07713b53da716006e86a60))
* **run:** reorder oclif sorted args ([#2976](https://github.com/heroku/cli/issues/2976)) ([aa560d3](https://github.com/heroku/cli/commit/aa560d33165b7c3085491a654cc16221b0274b58))
* use linux/amd64 platform only for m1/m2 macs (arm64) ([#2986](https://github.com/heroku/cli/issues/2986)) ([1e0bf11](https://github.com/heroku/cli/commit/1e0bf1192bf18424cc85ec594248095b324e335b))
* **W-16441506:** redis:cli command not working for private redis instances ([#2973](https://github.com/heroku/cli/issues/2973)) ([2d58422](https://github.com/heroku/cli/commit/2d58422cb4926a3d8bb909883fff9a8eeade098b))





# [9.1.0](https://github.com/heroku/cli/compare/v9.0.0...v9.1.0) (2024-07-30)


### Bug Fixes

* **cli:** Fix recursive behavior so that it pushes all dockerfiles with process types not provided ([#2958](https://github.com/heroku/cli/pull/2958)) ([7363461](https://github.com/heroku/cli/commit/7363461d1c9b65433bc928b1de20adfe7ac0ff66))
* **cli:** Allow app.build_stack to be container for ensureContainerStack ([#2952](https://github.com/heroku/cli/pull/2952)) ([3bba8e1](https://github.com/heroku/cli/commit/3bba8e178f2b1524c3866abcafccbb0d63ed2dc2))

### Features

* **domains:** update custom domains functionality ([#2920](https://github.com/heroku/cli/issues/2920)) ([045eab4](https://github.com/heroku/cli/commit/045eab4f429870f5917f3ab24500dd159fccc7dc))





# [9.0.0](https://github.com/heroku/cli/compare/v8.11.5...v9.0.0) (2024-07-16)

**Note:** Version bump only for package heroku





## [8.11.5](https://github.com/heroku/cli/compare/v8.11.4...v8.11.5) (2024-04-30)

**Note:** Version bump only for package heroku





## [8.11.4](https://github.com/heroku/cli/compare/v8.11.3...v8.11.4) (2024-04-16)

**Note:** Version bump only for package heroku





## [8.11.3](https://github.com/heroku/cli/compare/v8.11.2...v8.11.3) (2024-04-15)


### Bug Fixes

* **authorizations:** surface api warnings in temporary fix ([#2804](https://github.com/heroku/cli/issues/2804)) ([33f8aac](https://github.com/heroku/cli/commit/33f8aac631e2b406f12a878bb1fd9a994df75025))





## [8.11.2](https://github.com/heroku/cli/compare/v8.11.1...v8.11.2) (2024-04-10)

**Note:** Version bump only for package heroku





## [8.11.1](https://github.com/heroku/cli/compare/v8.11.0...v8.11.1) (2024-03-25)

**Note:** Version bump only for package heroku





# [8.11.0](https://github.com/heroku/cli/compare/v8.10.0...v8.11.0) (2024-03-20)


### Bug Fixes

* **tests:** Increasing Mocha timeouts ([#2649](https://github.com/heroku/cli/issues/2649)) ([fe49fa0](https://github.com/heroku/cli/commit/fe49fa031d89193906cb86c4f793e0c69453c7d6))
* **workflow:** remove fig command & update workflow ([#2686](https://github.com/heroku/cli/issues/2686)) ([748e71c](https://github.com/heroku/cli/commit/748e71c1026474bb75bf44ccd5c10720ff811f7b))
* **workflow:** update fig autocomplete workflow ([#2679](https://github.com/heroku/cli/issues/2679)) ([536b2ec](https://github.com/heroku/cli/commit/536b2ecdf797d352bdcc994e439c909e5e09222e))


### Features

* **pg:upgrade:** support essential dbs ([#2637](https://github.com/heroku/cli/issues/2637)) ([c062c59](https://github.com/heroku/cli/commit/c062c590956afe38c60ea57982ccc28b51b2c5b5))





# [8.10.0](https://github.com/heroku/cli/compare/v8.9.0...v8.10.0) (2024-02-19)

**Note:** Version bump only for package heroku





# [8.9.0](https://github.com/heroku/cli/compare/v8.8.0...v8.9.0) (2024-02-09)

**Note:** Version bump only for package heroku





# [8.8.0](https://github.com/heroku/cli/compare/v8.7.1...v8.8.0) (2024-02-07)


### Bug Fixes

* bump @oclif/plugin-update to a version that doesn't delete the CLI ([#2585](https://github.com/heroku/cli/issues/2585)) ([30c3963](https://github.com/heroku/cli/commit/30c396344e0545008484489158b7b453fb1f9527))
* set default port for heroku:local to 5006 ([#2618](https://github.com/heroku/cli/issues/2618)) ([9687e82](https://github.com/heroku/cli/commit/9687e82c152548ea593778b2caf2d0413ec7c75a))





## [8.7.1](https://github.com/heroku/cli/compare/v8.7.0...v8.7.1) (2023-11-06)

**Note:** Version bump only for package heroku





# [8.7.0](https://github.com/heroku/cli/compare/v8.6.0...v8.7.0) (2023-10-24)

**Note:** Version bump only for package heroku





# [8.6.0](https://github.com/heroku/cli/compare/v8.5.0...v8.6.0) (2023-10-16)


### Bug Fixes

* remove dotenv as no longer necessary ([#2497](https://github.com/heroku/cli/issues/2497)) ([a5ae035](https://github.com/heroku/cli/commit/a5ae035a4d9bc3b5392b62c57c6a283c6e4bcea5))





# [8.5.0](https://github.com/heroku/cli/compare/v8.4.3...v8.5.0) (2023-09-28)


### Bug Fixes

* default to --port 5001 for heroku local ([#2475](https://github.com/heroku/cli/issues/2475)) ([4f7a7c3](https://github.com/heroku/cli/commit/4f7a7c3d87f6cb6010369460a30b272a39883223))





## [8.4.3](https://github.com/heroku/cli/compare/v8.4.2...v8.4.3) (2023-09-18)


### Bug Fixes

* correctly handling CLI errors again. ([#2467](https://github.com/heroku/cli/issues/2467)) ([e8f3f5f](https://github.com/heroku/cli/commit/e8f3f5f5b9ae785389f10f88f84f72007a2a5782))





## [8.4.2](https://github.com/heroku/cli/compare/v8.4.1...v8.4.2) (2023-08-30)


### Bug Fixes

* **run:** downgrade @heroku-cli/plugins-run to @oclif/core v1 ([#2460](https://github.com/heroku/cli/issues/2460)) ([7666459](https://github.com/heroku/cli/commit/76664592e108babd934e1d15c9481009f4fb422f))
* **run:** move commands back into CLI & use @oclif/core v1 ([#2463](https://github.com/heroku/cli/issues/2463)) ([d072a64](https://github.com/heroku/cli/commit/d072a647d506026a541b16f8d311f9c7c59c582f)), closes [#2460](https://github.com/heroku/cli/issues/2460) [#2460](https://github.com/heroku/cli/issues/2460)





## [8.4.1](https://github.com/heroku/cli/compare/v8.4.0...v8.4.1) (2023-08-29)

**Note:** Version bump only for package heroku





# [8.4.0](https://github.com/heroku/cli/compare/v8.3.1...v8.4.0) (2023-08-23)


### Bug Fixes

* rollbar version segmentation and telemetry initialization ([#2451](https://github.com/heroku/cli/issues/2451)) ([46725e7](https://github.com/heroku/cli/commit/46725e712f6d8bc17ff3b34bc4dc7e296bbf08fe))





## [8.3.1](https://github.com/heroku/cli/compare/v8.3.0...v8.3.1) (2023-08-18)


### Bug Fixes

* **cli:** update boolean logic and add package parser util ([#2449](https://github.com/heroku/cli/issues/2449)) ([9c7099c](https://github.com/heroku/cli/commit/9c7099c03fbfe85320cad7dad3776c758043b2ac))





# [8.3.0](https://github.com/heroku/cli/compare/v8.2.0...v8.3.0) (2023-08-16)


### Features

* **cli:** add cli performance telemetry ([#2425](https://github.com/heroku/cli/issues/2425)) ([#2435](https://github.com/heroku/cli/issues/2435)) ([465c806](https://github.com/heroku/cli/commit/465c806e967e66ec94f9b5fd3a4fac4baea4af78)), closes [#2434](https://github.com/heroku/cli/issues/2434)





# [8.2.0](https://github.com/heroku/cli/compare/v8.1.9...v8.2.0) (2023-08-14)


### Bug Fixes

* build cli for all tests to save time. ([#2436](https://github.com/heroku/cli/issues/2436)) ([c81c801](https://github.com/heroku/cli/commit/c81c801e310738460f3d27d7241bfa2462426dcd))
* monorepo dependency issues - upgrade to yarn 3 ([#2429](https://github.com/heroku/cli/issues/2429)) ([0d7e5ca](https://github.com/heroku/cli/commit/0d7e5ca519799af4352ec973f51b45748699f3a1))
* turns out tslib is actually a runtime dependency, not just dev. ([#2427](https://github.com/heroku/cli/issues/2427)) ([76b3dc3](https://github.com/heroku/cli/commit/76b3dc3829a998c5235879f21b8b3795d1fd2044))
* use correct path for update hooks ([#2426](https://github.com/heroku/cli/issues/2426)) ([e55e00f](https://github.com/heroku/cli/commit/e55e00f920a066af01f1febd697054f812183c92))


### Features

* **cli:** add rollbar ([#2424](https://github.com/heroku/cli/issues/2424)) ([9a52f2f](https://github.com/heroku/cli/commit/9a52f2f8e9c8bf27e0d5c5cf04ca592e61188359))





## [8.1.9](https://github.com/heroku/cli/compare/v8.1.8...v8.1.9) (2023-06-21)

**Note:** Version bump only for package heroku





## [8.1.8](https://github.com/heroku/cli/compare/v8.1.7...v8.1.8) (2023-06-14)

**Note:** Version bump only for package heroku





## [8.1.7](https://github.com/heroku/cli/compare/v8.1.4...v8.1.7) (2023-06-01)

**Note:** Version bump only for package heroku





## [8.1.6](https://github.com/heroku/cli/compare/v8.1.4...v8.1.6) (2023-05-31)

**Note:** Version bump only for package heroku





## [8.1.5](https://github.com/heroku/cli/compare/v8.1.4...v8.1.5) (2023-05-30)

**Note:** Version bump only for package heroku





## [8.1.4](https://github.com/heroku/cli/compare/v8.1.3...v8.1.4) (2023-05-24)

**Note:** Version bump only for package heroku





## [8.1.3](https://github.com/heroku/cli/compare/v8.1.2...v8.1.3) (2023-05-01)

**Note:** Version bump only for package heroku





## [8.1.2](https://github.com/heroku/cli/compare/v8.1.1...v8.1.2) (2023-05-01)

**Note:** Version bump only for package heroku





## [8.1.1](https://github.com/heroku/cli/compare/v8.1.0...v8.1.1) (2023-04-27)

**Note:** Version bump only for package heroku





# [8.1.0](https://github.com/heroku/cli/compare/v8.0.6...v8.1.0) (2023-04-27)

**Note:** Version bump only for package heroku





## [8.0.6](https://github.com/heroku/cli/compare/v8.0.5...v8.0.6) (2023-04-24)

**Note:** Version bump only for package heroku





## [8.0.5](https://github.com/heroku/cli/compare/v8.0.4...v8.0.5) (2023-04-18)


### Bug Fixes

* oclif promote step ([#2301](https://github.com/heroku/cli/issues/2301)) ([4e94fb1](https://github.com/heroku/cli/commit/4e94fb1fdc1a591bd1b744e2da69c0e0df03ed6e))





## [8.0.4](https://github.com/heroku/cli/compare/v8.0.3...v8.0.4) (2023-04-11)


### Bug Fixes

* update plugin-update bump for WSL fix. ([#2291](https://github.com/heroku/cli/issues/2291)) ([a939d6e](https://github.com/heroku/cli/commit/a939d6e32e8c7a0469fe430a38775b8faec4b11b))





## [8.0.3](https://github.com/heroku/cli/compare/v8.0.2...v8.0.3) (2023-04-04)


### Bug Fixes

* update @oclif/plugin-plugins to bug fix to allow installing Legacy plugins ([#2281](https://github.com/heroku/cli/issues/2281)) ([1feb0b0](https://github.com/heroku/cli/commit/1feb0b0e2092378a6ef017d7123d9d8dce465471))
* update to latest @oclif/plugin-plugins ([#2283](https://github.com/heroku/cli/issues/2283)) ([9176549](https://github.com/heroku/cli/commit/9176549f7047c64719f3000220d8643fdd1cdaf7))





## [8.0.2](https://github.com/heroku/cli/compare/v7.69.1...v8.0.2) (2023-03-16)

**Note:** Version bump only for package heroku





## [7.69.2](https://github.com/heroku/cli/compare/v7.69.1...v7.69.2) (2023-03-16)

**Note:** Version bump only for package heroku





## [7.69.1](https://github.com/heroku/cli/compare/v7.69.0...v7.69.1) (2023-03-09)

**Note:** Version bump only for package heroku





# [7.69.0](https://github.com/heroku/cli/compare/v7.68.3...v7.69.0) (2023-03-07)

**Note:** Version bump only for package heroku





## [7.68.3](https://github.com/heroku/cli/compare/v7.68.2...v7.68.3) (2023-03-06)


### Bug Fixes

* add node 14 to unit tests in CI. ([#2254](https://github.com/heroku/cli/issues/2254)) ([2257add](https://github.com/heroku/cli/commit/2257adda8306d2391c60486559f46adba74a5f69))





## [7.68.2](https://github.com/heroku/cli/compare/v7.68.1...v7.68.2) (2023-02-21)

**Note:** Version bump only for package heroku





## [7.68.1](https://github.com/heroku/cli/compare/v7.68.0...v7.68.1) (2023-02-14)

**Note:** Version bump only for package heroku





# [7.68.0](https://github.com/heroku/cli/compare/v8.0.1...v7.68.0) (2023-02-06)


### Bug Fixes

* revert to v7.67.2 ([#2235](https://github.com/heroku/cli/issues/2235)) ([0955a24](https://github.com/heroku/cli/commit/0955a24d6aeafdec7211ffd6179f772560f35098)), closes [#2231](https://github.com/heroku/cli/issues/2231) [#2230](https://github.com/heroku/cli/issues/2230) [#2229](https://github.com/heroku/cli/issues/2229) [#2228](https://github.com/heroku/cli/issues/2228) [#2227](https://github.com/heroku/cli/issues/2227) [#2225](https://github.com/heroku/cli/issues/2225) [#2144](https://github.com/heroku/cli/issues/2144) [#2216](https://github.com/heroku/cli/issues/2216) [#2207](https://github.com/heroku/cli/issues/2207) [#2212](https://github.com/heroku/cli/issues/2212) [#2212](https://github.com/heroku/cli/issues/2212)





## [7.67.2](https://github.com/heroku/cli/compare/v7.67.1...v7.67.2) (2023-01-23)

**Note:** Version bump only for package heroku





## [7.67.1](https://github.com/heroku/cli/compare/v7.67.0...v7.67.1) (2022-11-30)

**Note:** Version bump only for package heroku





# [7.67.0](https://github.com/heroku/cli/compare/v7.66.4...v7.67.0) (2022-11-29)

**Note:** Version bump only for package heroku





## [7.66.4](https://github.com/heroku/cli/compare/v7.66.3...v7.66.4) (2022-11-16)

**Note:** Version bump only for package heroku





## [7.66.3](https://github.com/heroku/cli/compare/v7.66.2...v7.66.3) (2022-11-14)


### Bug Fixes

* debian builds to run in ci round 2 ([#2132](https://github.com/heroku/cli/issues/2132)) ([bd32cdc](https://github.com/heroku/cli/commit/bd32cdcee3a7a214b6aea6f309aae1a8ac2ae65e))





## [7.66.2](https://github.com/heroku/cli/compare/v7.66.0...v7.66.2) (2022-11-10)

**Note:** Version bump only for package heroku





## [7.66.1](https://github.com/heroku/cli/compare/v7.66.0...v7.66.1) (2022-11-09)

**Note:** Version bump only for package heroku





## [7.66.0](https://github.com/heroku/cli/compare/v7.65.0...v7.66.0) (2022-11-07)

**Note:** Version bump only for package heroku





# [7.65.0](https://github.com/heroku/cli/compare/v7.64.0...v7.65.0) (2022-10-10)

**Note:** Version bump only for package heroku





# [7.64.0](https://github.com/heroku/cli/compare/v7.62.0...v7.64.0) (2022-10-03)

**Note:** Version bump only for package heroku





## [7.63.4](https://github.com/heroku/cli/compare/v7.63.0...v7.63.4) (2022-09-14)

**Note:** Version bump only for package heroku





## [7.63.3](https://github.com/heroku/cli/compare/v7.63.0...v7.63.3) (2022-09-13)

**Note:** Version bump only for package heroku





## [7.63.2](https://github.com/heroku/cli/compare/v7.63.0...v7.63.2) (2022-09-12)

**Note:** Version bump only for package heroku





## [7.63.1](https://github.com/heroku/cli/compare/v7.63.0...v7.63.1) (2022-09-09)

**Note:** Version bump only for package heroku





# [7.63.0](https://github.com/heroku/cli/compare/v7.62.0...v7.63.0) (2022-08-31)

**Note:** Version bump only for package heroku





# [7.62.0](https://github.com/heroku/cli/compare/v7.60.2...v7.62.0) (2022-08-04)


### Bug Fixes

* **certs-v5:** Removing references to SSL endpoints in the CLI ([#1885](https://github.com/heroku/cli/issues/1885)) ([94c1d98](https://github.com/heroku/cli/commit/94c1d98dfb171824e7aea8c9377ad68dae79caca))
* upgrade @oclif/command from 1.5.18 to 1.8.0 ([#1890](https://github.com/heroku/cli/issues/1890)) ([297531c](https://github.com/heroku/cli/commit/297531cabc2474ddb025f9b952d10bb5345cf11d))
* upgrade @oclif/command from 1.8.0 to 1.8.16 ([#2026](https://github.com/heroku/cli/issues/2026)) ([cbfdb0c](https://github.com/heroku/cli/commit/cbfdb0c8303d6ed752681203b8f6491a55397b6c))
* upgrade @oclif/plugin-plugins from 1.7.9 to 1.10.1 ([#1889](https://github.com/heroku/cli/issues/1889)) ([2a135cc](https://github.com/heroku/cli/commit/2a135cc931d714aa9d739b953d6ed056ce215ef2))
* upgrade @oclif/plugin-update from 1.3.9 to 1.5.0 ([#1892](https://github.com/heroku/cli/issues/1892)) ([ad3c97c](https://github.com/heroku/cli/commit/ad3c97c0a7d16a14d8b50f3f2f3d4bf3a70a662b))





## [7.61.1](https://github.com/heroku/cli/compare/v7.60.2...v7.61.1) (2022-08-03)


### Bug Fixes

* upgrade @oclif/command from 1.5.18 to 1.8.0 ([#1890](https://github.com/heroku/cli/issues/1890)) ([297531c](https://github.com/heroku/cli/commit/297531cabc2474ddb025f9b952d10bb5345cf11d))
* upgrade @oclif/command from 1.8.0 to 1.8.16 ([#2026](https://github.com/heroku/cli/issues/2026)) ([cbfdb0c](https://github.com/heroku/cli/commit/cbfdb0c8303d6ed752681203b8f6491a55397b6c))
* upgrade @oclif/plugin-plugins from 1.7.9 to 1.10.1 ([#1889](https://github.com/heroku/cli/issues/1889)) ([2a135cc](https://github.com/heroku/cli/commit/2a135cc931d714aa9d739b953d6ed056ce215ef2))
* upgrade @oclif/plugin-update from 1.3.9 to 1.5.0 ([#1892](https://github.com/heroku/cli/issues/1892)) ([ad3c97c](https://github.com/heroku/cli/commit/ad3c97c0a7d16a14d8b50f3f2f3d4bf3a70a662b))





# [7.61.0](https://github.com/heroku/cli/compare/v7.60.2...v7.61.0) (2022-08-03)


### Bug Fixes

* upgrade @oclif/command from 1.5.18 to 1.8.0 ([#1890](https://github.com/heroku/cli/issues/1890)) ([297531c](https://github.com/heroku/cli/commit/297531cabc2474ddb025f9b952d10bb5345cf11d))
* upgrade @oclif/command from 1.8.0 to 1.8.16 ([#2026](https://github.com/heroku/cli/issues/2026)) ([cbfdb0c](https://github.com/heroku/cli/commit/cbfdb0c8303d6ed752681203b8f6491a55397b6c))
* upgrade @oclif/plugin-plugins from 1.7.9 to 1.10.1 ([#1889](https://github.com/heroku/cli/issues/1889)) ([2a135cc](https://github.com/heroku/cli/commit/2a135cc931d714aa9d739b953d6ed056ce215ef2))
* upgrade @oclif/plugin-update from 1.3.9 to 1.5.0 ([#1892](https://github.com/heroku/cli/issues/1892)) ([ad3c97c](https://github.com/heroku/cli/commit/ad3c97c0a7d16a14d8b50f3f2f3d4bf3a70a662b))





## [7.60.2](https://github.com/heroku/cli/compare/v7.60.1...v7.60.2) (2022-04-27)

**Note:** Version bump only for package heroku





## [7.60.1](https://github.com/heroku/cli/compare/v7.60.0...v7.60.1) (2022-03-31)


### Bug Fixes

* upgrade tslib from 1.9.3 to 1.14.1 ([#1891](https://github.com/heroku/cli/issues/1891)) ([ccfe505](https://github.com/heroku/cli/commit/ccfe5057a1476a126316662ae4f50b7ebe48d4eb))





# [7.60.0](https://github.com/heroku/cli/compare/v7.59.1...v7.60.0) (2022-03-23)


### Features

* upgrade to node 14.19.0 ([#1953](https://github.com/heroku/cli/issues/1953)) ([f54bb24](https://github.com/heroku/cli/commit/f54bb24e343d20cf02fd72747be21e737680e81c))





## [7.59.4](https://github.com/heroku/cli/compare/v7.59.3...v7.59.4) (2022-03-08)

**Note:** Version bump only for package heroku





## [7.59.3](https://github.com/heroku/cli/compare/v7.59.2...v7.59.3) (2022-02-28)

**Note:** Version bump only for package heroku





## [7.59.2](https://github.com/heroku/cli/compare/v7.59.1...v7.59.2) (2021-11-18)

**Note:** Version bump only for package heroku





## [7.59.1](https://github.com/heroku/cli/compare/v7.59.0...v7.59.1) (2021-10-21)

**Note:** Version bump only for package heroku





# [7.59.0](https://github.com/heroku/cli/compare/v7.58.0...v7.59.0) (2021-08-24)

**Note:** Version bump only for package heroku





# [7.58.0](https://github.com/heroku/cli/compare/v7.57.0...v7.58.0) (2021-08-24)

**Note:** Version bump only for package heroku





# [7.57.0](https://github.com/heroku/cli/compare/v7.56.1...v7.57.0) (2021-08-17)

**Note:** Version bump only for package heroku





## [7.56.1](https://github.com/heroku/cli/compare/v7.56.0...v7.56.1) (2021-07-12)

**Note:** Version bump only for package heroku





# [7.56.0](https://github.com/heroku/cli/compare/v7.55.0...v7.56.0) (2021-06-29)

**Note:** Version bump only for package heroku





# [7.55.0](https://github.com/heroku/cli/compare/v7.54.1...v7.55.0) (2021-06-25)

**Note:** Version bump only for package heroku





## [7.54.1](https://github.com/heroku/cli/compare/v7.54.0...v7.54.1) (2021-06-08)

**Note:** Version bump only for package heroku





# [7.54.0](https://github.com/heroku/cli/compare/v7.47.10...v7.54.0) (2021-05-18)


### Features

* upgrade node to 12.21.0 ([fb27477](https://github.com/heroku/cli/commit/fb274776ea5ed28d31cb8a53e6cfb6819e6ef4a9))





## [7.53.1](https://github.com/heroku/cli/compare/v7.53.0...v7.53.1) (2021-05-05)

**Note:** Version bump only for package heroku





# [7.53.0](https://github.com/heroku/cli/compare/v7.52.0...v7.53.0) (2021-04-27)

**Note:** Version bump only for package heroku





# [7.52.0](https://github.com/heroku/cli/compare/v7.51.0...v7.52.0) (2021-04-07)

**Note:** Version bump only for package heroku





# [7.51.0](https://github.com/heroku/cli/compare/v7.50.0...v7.51.0) (2021-03-17)


### Features

* upgrade node to 12.21.0 ([fb27477](https://github.com/heroku/cli/commit/fb274776ea5ed28d31cb8a53e6cfb6819e6ef4a9))





# [7.50.0](https://github.com/heroku/cli/compare/v7.49.1...v7.50.0) (2021-03-02)

**Note:** Version bump only for package heroku





## [7.49.1](https://github.com/heroku/cli/compare/v7.49.0...v7.49.1) (2021-02-26)

**Note:** Version bump only for package heroku





# [7.49.0](https://github.com/heroku/cli/compare/v7.47.13...v7.49.0) (2021-02-24)

**Note:** Version bump only for package heroku





# [7.48.0](https://github.com/heroku/cli/compare/v7.47.13...v7.48.0) (2021-02-22)

**Note:** Version bump only for package heroku





## [7.47.13](https://github.com/heroku/cli/compare/v7.47.12...v7.47.13) (2021-02-18)

**Note:** Version bump only for package heroku





## [7.47.12](https://github.com/heroku/cli/compare/v7.47.11...v7.47.12) (2021-02-03)

**Note:** Version bump only for package heroku





## [7.47.11](https://github.com/heroku/cli/compare/v7.47.10...v7.47.11) (2021-01-22)

**Note:** Version bump only for package heroku





## [7.47.10](https://github.com/heroku/cli/compare/v7.47.7...v7.47.10) (2021-01-21)

**Note:** Version bump only for package heroku





## [7.47.9](https://github.com/heroku/cli/compare/v7.47.7...v7.47.9) (2021-01-21)

**Note:** Version bump only for package heroku





## [7.47.8](https://github.com/heroku/cli/compare/v7.47.2...v7.47.8) (2021-01-19)

**Note:** Version bump only for package heroku





## [7.47.7](https://github.com/heroku/cli/compare/v7.47.6...v7.47.7) (2021-01-05)

**Note:** Version bump only for package heroku





## [7.47.6](https://github.com/heroku/cli/compare/v7.47.5...v7.47.6) (2020-12-16)

**Note:** Version bump only for package heroku





## [7.47.5](https://github.com/heroku/cli/compare/v7.47.4...v7.47.5) (2020-12-10)

**Note:** Version bump only for package heroku





## [7.47.4](https://github.com/heroku/cli/compare/v7.47.3...v7.47.4) (2020-12-01)

**Note:** Version bump only for package heroku





## [7.47.3](https://github.com/heroku/cli/compare/v7.47.2...v7.47.3) (2020-11-18)

**Note:** Version bump only for package heroku





## [7.47.2](https://github.com/heroku/cli/compare/v7.47.1...v7.47.2) (2020-11-11)

**Note:** Version bump only for package heroku

## [7.47.1](https://github.com/heroku/cli/compare/v7.47.0...v7.47.1) (2020-11-10)

**Note:** Version bump only for package heroku

# [7.47.0](https://github.com/heroku/cli/compare/v7.46.2...v7.47.0) (2020-10-29)

**Note:** Version bump only for package heroku

## [7.46.2](https://github.com/heroku/cli/compare/v7.46.1...v7.46.2) (2020-10-22)

**Note:** Version bump only for package heroku

## [7.46.1](https://github.com/heroku/cli/compare/v7.46.0...v7.46.1) (2020-10-20)

**Note:** Version bump only for package heroku

# [7.46.0](https://github.com/heroku/cli/compare/v7.45.0...v7.46.0) (2020-10-13)

**Note:** Version bump only for package heroku

# [7.45.0](https://github.com/heroku/cli/compare/v7.44.0...v7.45.0) (2020-10-07)

**Note:** Version bump only for package heroku

# [7.44.0](https://github.com/heroku/cli/compare/v7.43.3...v7.44.0) (2020-10-01)

**Note:** Version bump only for package heroku

## [7.43.3](https://github.com/heroku/cli/compare/v7.43.2...v7.43.3) (2020-09-29)

**Note:** Version bump only for package heroku

## [7.43.2](https://github.com/heroku/cli/compare/v7.43.1...v7.43.2) (2020-09-22)

**Note:** Version bump only for package heroku

## [7.43.1](https://github.com/heroku/cli/compare/v7.43.0...v7.43.1) (2020-09-21)

**Note:** Version bump only for package heroku

# [7.43.0](https://github.com/heroku/cli/compare/v7.42.13...v7.43.0) (2020-09-15)

**Note:** Version bump only for package heroku

## [7.42.13](https://github.com/heroku/cli/compare/v7.42.12...v7.42.13) (2020-08-27)

**Note:** Version bump only for package heroku

## [7.42.12](https://github.com/heroku/cli/compare/v7.42.11...v7.42.12) (2020-08-26)

**Note:** Version bump only for package heroku

## [7.42.11](https://github.com/heroku/cli/compare/v7.42.10...v7.42.11) (2020-08-25)

**Note:** Version bump only for package heroku

## [7.42.10](https://github.com/heroku/cli/compare/v7.42.9...v7.42.10) (2020-08-25)

**Note:** Version bump only for package heroku

## [7.42.9](https://github.com/heroku/cli/compare/v7.42.8...v7.42.9) (2020-08-25)

**Note:** Version bump only for package heroku

## [7.42.8](https://github.com/heroku/cli/compare/v7.42.7...v7.42.8) (2020-08-17)

**Note:** Version bump only for package heroku

## [7.42.6](https://github.com/heroku/cli/compare/v7.42.5...v7.42.6) (2020-07-30)

**Note:** Version bump only for package heroku

## [7.42.5](https://github.com/heroku/cli/compare/v7.42.4...v7.42.5) (2020-07-20)

**Note:** Version bump only for package heroku

## [7.42.4](https://github.com/heroku/cli/compare/v7.42.3...v7.42.4) (2020-07-13)

**Note:** Version bump only for package heroku

## [7.42.3](https://github.com/heroku/cli/compare/v7.42.2...v7.42.3) (2020-07-09)

### Bug Fixes

- use inclusive terms ([#1553](https://github.com/heroku/cli/issues/1553)) ([3639297](https://github.com/heroku/cli/commit/36392971cba2a4e4e9077c4575626bfb89c5005a))

## [7.42.2](https://github.com/heroku/cli/compare/v7.42.1...v7.42.2) (2020-06-22)

**Note:** Version bump only for package heroku

## [7.42.1](https://github.com/heroku/cli/compare/v7.42.0...v7.42.1) (2020-06-05)

**Note:** Version bump only for package heroku

# [7.42.0](https://github.com/heroku/cli/compare/v7.41.1...v7.42.0) (2020-06-03)

### Bug Fixes

- upgrade http-call from 5.2.3 to 5.3.0 ([#1525](https://github.com/heroku/cli/issues/1525)) ([ffd81cd](https://github.com/heroku/cli/commit/ffd81cdce6f32d57a59db758733f908519d15594))

## [7.41.1](https://github.com/heroku/cli/compare/v7.41.0...v7.41.1) (2020-05-12)

**Note:** Version bump only for package heroku

# [7.41.0](https://github.com/heroku/cli/compare/v7.40.0...v7.41.0) (2020-05-11)

### Features

- v7 plugin run ([#1507](https://github.com/heroku/cli/issues/1507)) ([6a77f5a](https://github.com/heroku/cli/commit/6a77f5a716ddada766ce9184b59cbaebe48e2953))

# [7.40.0](https://github.com/heroku/cli/compare/v7.39.6...v7.40.0) (2020-05-01)

**Note:** Version bump only for package heroku

## [7.39.6](https://github.com/heroku/cli/compare/v7.39.5...v7.39.6) (2020-05-01)

**Note:** Version bump only for package heroku

## [7.39.5](https://github.com/heroku/cli/compare/v7.39.4...v7.39.5) (2020-04-22)

### Bug Fixes

- **cli:** dummy fix to trigger lerna ([40c0281](https://github.com/heroku/cli/commit/40c0281c5808e3f15bedfd0bd279ce56c0eb4a4d))

## [7.39.4](https://github.com/heroku/cli/compare/v7.39.3...v7.39.4) (2020-04-22)

**Note:** Version bump only for package heroku

## [7.39.3](https://github.com/heroku/cli/compare/v7.39.2...v7.39.3) (2020-04-15)

### Bug Fixes

- update to a notarized version of node ([#1481](https://github.com/heroku/cli/issues/1481)) ([a01c03c](https://github.com/heroku/cli/commit/a01c03cf45b8d02477754da382112c4905d91ecc))

## [7.39.2](https://github.com/heroku/cli/compare/v7.39.1...v7.39.2) (2020-03-30)

**Note:** Version bump only for package heroku

## [7.39.1](https://github.com/heroku/cli/compare/v7.39.0...v7.39.1) (2020-03-19)

**Note:** Version bump only for package heroku

# [7.39.0](https://github.com/heroku/cli/compare/v7.38.2...v7.39.0) (2020-03-02)

**Note:** Version bump only for package heroku

## [7.38.2](https://github.com/heroku/cli/compare/v7.38.1...v7.38.2) (2020-02-19)

**Note:** Version bump only for package heroku

## [7.38.1](https://github.com/heroku/cli/compare/v7.38.0...v7.38.1) (2020-02-10)

**Note:** Version bump only for package heroku

# [7.38.0](https://github.com/heroku/cli/compare/v7.37.0...v7.38.0) (2020-02-06)

**Note:** Version bump only for package heroku

# [7.37.0](https://github.com/heroku/cli/compare/v7.36.3...v7.37.0) (2020-01-25)

**Note:** Version bump only for package heroku

## [7.36.3](https://github.com/heroku/cli/compare/v7.36.2...v7.36.3) (2020-01-21)

**Note:** Version bump only for package heroku

## [7.36.2](https://github.com/heroku/cli/compare/v7.36.1...v7.36.2) (2020-01-21)

**Note:** Version bump only for package heroku

## [7.36.1](https://github.com/heroku/cli/compare/v7.36.0...v7.36.1) (2020-01-21)

**Note:** Version bump only for package heroku

# [7.36.0](https://github.com/heroku/cli/compare/v7.35.1...v7.36.0) (2020-01-20)

**Note:** Version bump only for package heroku

## [7.35.1](https://github.com/heroku/cli/compare/v7.35.0...v7.35.1) (2019-12-19)

**Note:** Version bump only for package heroku

# [7.35.0](https://github.com/heroku/cli/compare/v7.34.2...v7.35.0) (2019-11-07)

**Note:** Version bump only for package heroku

## [7.34.2](https://github.com/heroku/cli/compare/v7.34.1...v7.34.2) (2019-11-05)

**Note:** Version bump only for package heroku

## [7.34.1](https://github.com/heroku/cli/compare/v7.34.0...v7.34.1) (2019-11-05)

### Bug Fixes

- **cli:** missing apps plugin in oclif plugins list ([81db582](https://github.com/heroku/cli/commit/81db582))

# [7.34.0](https://github.com/heroku/cli/compare/v7.33.3...v7.34.0) (2019-11-05)

### Bug Fixes

- **cli:** remove heroku-redis user installs ([#1357](https://github.com/heroku/cli/issues/1357)) ([6d409e2](https://github.com/heroku/cli/commit/6d409e2))

### Features

- **apps:** add oclif version of domains cmds ([#1361](https://github.com/heroku/cli/issues/1361)) ([66c7c4e](https://github.com/heroku/cli/commit/66c7c4e))
- **cli:** bump node version for oclif.update.node.version to node 12 ([#1368](https://github.com/heroku/cli/issues/1368)) ([72668ba](https://github.com/heroku/cli/commit/72668ba))

## [7.33.3](https://github.com/heroku/cli/compare/v7.33.2...v7.33.3) (2019-10-09)

**Note:** Version bump only for package heroku

## [7.33.2](https://github.com/heroku/cli/compare/v7.33.1...v7.33.2) (2019-10-09)

**Note:** Version bump only for package heroku

## [7.33.1](https://github.com/heroku/cli/compare/v7.33.0...v7.33.1) (2019-10-03)

### Bug Fixes

- **cli:** bring back v5 run plugin ([#1349](https://github.com/heroku/cli/issues/1349)) ([15234fe](https://github.com/heroku/cli/commit/15234fe))

# [7.33.0](https://github.com/heroku/cli/compare/v7.32.0...v7.33.0) (2019-10-01)

### Features

- **pipelines:** convert pipelines:setup to oclif ([#1344](https://github.com/heroku/cli/issues/1344)) ([9f94577](https://github.com/heroku/cli/commit/9f94577))

# [7.32.0](https://github.com/heroku/cli/compare/v7.31.2...v7.32.0) (2019-10-01)

### Features

- **run:** covert run plugin to oclif ([#1317](https://github.com/heroku/cli/issues/1317)) ([49b19f1](https://github.com/heroku/cli/commit/49b19f1))

## [7.31.2](https://github.com/heroku/cli/compare/v7.31.1...v7.31.2) (2019-09-30)

### Bug Fixes

- **cli:** uninstall old autocomplete plugin ([#1345](https://github.com/heroku/cli/issues/1345)) ([8dc20e7](https://github.com/heroku/cli/commit/8dc20e7))

## [7.31.1](https://github.com/heroku/cli/compare/v7.31.0...v7.31.1) (2019-09-30)

**Note:** Version bump only for package heroku

# [7.31.0](https://github.com/heroku/cli/compare/v7.30.1...v7.31.0) (2019-09-30)

### Bug Fixes

- **pipelines-v5:** keep pipelines:setup v5 cmd ([#1340](https://github.com/heroku/cli/issues/1340)) ([9658f6a](https://github.com/heroku/cli/commit/9658f6a))

### Features

- **pipelines:** finishing converting pipelines plugin to oclif ([#1310](https://github.com/heroku/cli/issues/1310)) ([42adcbb](https://github.com/heroku/cli/commit/42adcbb))

## [7.30.1](https://github.com/heroku/cli/compare/v7.30.0...v7.30.1) (2019-09-24)

**Note:** Version bump only for package heroku

# [7.30.0](https://github.com/heroku/cli/compare/v7.29.0...v7.30.0) (2019-09-16)

### Features

- **run:** convert run-v5 plugin to oclif ([#1289](https://github.com/heroku/cli/issues/1289)) ([8df77c0](https://github.com/heroku/cli/commit/8df77c0)), closes [#1302](https://github.com/heroku/cli/issues/1302)

# [7.29.0](https://github.com/heroku/cli/compare/v7.28.0...v7.29.0) (2019-08-21)

### Features

- **webhooks:** add oclif version of webhooks plugin ([#1253](https://github.com/heroku/cli/issues/1253)) ([110c516](https://github.com/heroku/cli/commit/110c516))

<a name="7.28.0"></a>

# [7.28.0](https://github.com/heroku/cli/compare/v7.27.1...v7.28.0) (2019-08-19)

**Note:** Version bump only for package heroku

<a name="7.27.1"></a>

## [7.27.1](https://github.com/heroku/cli/compare/v7.27.0...v7.27.1) (2019-07-30)

### Bug Fixes

- **cli:** upgrade v7 plugin-pipelines ([13ca934](https://github.com/heroku/cli/commit/13ca934))

<a name="7.27.0"></a>

# [7.27.0](https://github.com/heroku/cli/compare/v7.26.2...v7.27.0) (2019-07-30)

### Bug Fixes

- pin qqjs ([c04fad3](https://github.com/heroku/cli/commit/c04fad3))

### Features

- **pipelines:** add reviewapps:enable command ([#1269](https://github.com/heroku/cli/issues/1269)) ([c9b7dbb](https://github.com/heroku/cli/commit/c9b7dbb))

<a name="7.24.3"></a>

## [7.24.3](https://github.com/heroku/cli/compare/v7.24.2...v7.24.3) (2019-05-07)

**Note:** Version bump only for package heroku

<a name="7.24.2"></a>

## [7.24.2](https://github.com/heroku/cli/compare/v7.24.1...v7.24.2) (2019-05-07)

**Note:** Version bump only for package heroku

<a name="7.22.2"></a>

## [7.22.2](https://github.com/heroku/cli/compare/v7.22.1...v7.22.2) (2019-02-28)

**Note:** Version bump only for package heroku

<a name="7.18.8"></a>

## [7.18.8](https://github.com/heroku/cli/compare/v7.18.7...v7.18.8) (2018-11-14)

**Note:** Version bump only for package heroku

<a name="7.16.5"></a>

## [7.16.5](https://github.com/heroku/cli/compare/v7.16.4...v7.16.5) (2018-10-04)

### Bug Fixes

- **cli:** allow list of version env var warnings ([#1057](https://github.com/heroku/cli/issues/1057)) ([e71214d](https://github.com/heroku/cli/commit/e71214d))

<a name="7.16.4"></a>

## [7.16.4](https://github.com/heroku/cli/compare/v7.16.3...v7.16.4) (2018-10-03)

**Note:** Version bump only for package heroku

<a name="7.16.3"></a>

## [7.16.3](https://github.com/heroku/cli/compare/v7.16.2...v7.16.3) (2018-10-03)

### Bug Fixes

- updated deps ([#1058](https://github.com/heroku/cli/issues/1058)) ([ce1fd6b](https://github.com/heroku/cli/commit/ce1fd6b))

<a name="7.16.2"></a>

## [7.16.2](https://github.com/heroku/cli/compare/v7.16.1...v7.16.2) (2018-10-02)

### Bug Fixes

- updated deps ([482dc85](https://github.com/heroku/cli/commit/482dc85))

<a name="7.16.1"></a>

## [7.16.1](https://github.com/heroku/cli/compare/v7.16.0...v7.16.1) (2018-10-02)

### Bug Fixes

- **cli:** add heroku env var warnings to version ([#1024](https://github.com/heroku/cli/issues/1024)) ([cf531e4](https://github.com/heroku/cli/commit/cf531e4))

<a name="7.16.0"></a>

# [7.16.0](https://github.com/heroku/cli/compare/v7.15.2...v7.16.0) (2018-09-14)

### Bug Fixes

- updated deps ([6d3be5a](https://github.com/heroku/cli/commit/6d3be5a))
- updated dev-cli ([022396b](https://github.com/heroku/cli/commit/022396b))

<a name="7.15.2"></a>

## [7.15.2](https://github.com/heroku/cli/compare/v7.15.1...v7.15.2) (2018-09-12)

### Bug Fixes

- **cli:** invalid package references ([33e1900](https://github.com/heroku/cli/commit/33e1900))

<a name="7.15.1"></a>

## [7.15.1](https://github.com/heroku/cli/compare/v7.15.0...v7.15.1) (2018-09-11)

### Bug Fixes

- switch back to non github app for releases ([#1025](https://github.com/heroku/cli/issues/1025)) ([06553b8](https://github.com/heroku/cli/commit/06553b8))

<a name="7.15.0"></a>

# [7.15.0](https://github.com/heroku/cli/compare/v7.14.4...v7.15.0) (2018-09-10)

### Features

- node 10.10.0 ([3a427dc](https://github.com/heroku/cli/commit/3a427dc))

<a name="7.14.4"></a>

## [7.14.4](https://github.com/heroku/cli/compare/v7.14.3...v7.14.4) (2018-09-07)

**Note:** Version bump only for package heroku

<a name="7.14.3"></a>

## [7.14.3](https://github.com/heroku/cli/compare/v7.14.2...v7.14.3) (2018-09-06)

**Note:** Version bump only for package heroku

<a name="7.14.2"></a>

## [7.14.2](https://github.com/heroku/cli/compare/v7.14.1...v7.14.2) (2018-08-30)

**Note:** Version bump only for package heroku

<a name="7.14.1"></a>

## [7.14.1](https://github.com/heroku/cli/compare/v7.14.0...v7.14.1) (2018-08-30)

**Note:** Version bump only for package heroku

<a name="7.14.0"></a>

# [7.14.0](https://github.com/heroku/cli/compare/v7.13.0...v7.14.0) (2018-08-30)

### Bug Fixes

- updated plugins plugin ([837ebc8](https://github.com/heroku/cli/commit/837ebc8))

<a name="7.13.0"></a>

# [7.13.0](https://github.com/heroku/cli/compare/v7.12.6...v7.13.0) (2018-08-30)

### Features

- **buildpacks:** added search, info, and versions commands ([#1000](https://github.com/heroku/cli/issues/1000)) ([c33f518](https://github.com/heroku/cli/commit/c33f518))

<a name="7.12.6"></a>

## [7.12.6](https://github.com/heroku/cli/compare/v7.12.5...v7.12.6) (2018-08-30)

### Bug Fixes

- windows test failures ([5b4d171](https://github.com/heroku/cli/commit/5b4d171))

<a name="7.12.5"></a>

## [7.12.5](https://github.com/heroku/cli/compare/v7.12.4...v7.12.5) (2018-08-29)

**Note:** Version bump only for package heroku

<a name="7.12.4"></a>

## [7.12.4](https://github.com/heroku/cli/compare/v7.12.3...v7.12.4) (2018-08-29)

### Bug Fixes

- updated http-call ([e17a164](https://github.com/heroku/cli/commit/e17a164))

<a name="7.12.3"></a>

## [7.12.3](https://github.com/heroku/cli/compare/v7.12.2...v7.12.3) (2018-08-27)

### Bug Fixes

- migrate heroku-splunk ([34f286f](https://github.com/heroku/cli/commit/34f286f))

<a name="7.12.2"></a>

## [7.12.2](https://github.com/heroku/cli/compare/v7.12.1...v7.12.2) (2018-08-24)

**Note:** Version bump only for package heroku

<a name="7.12.1"></a>

## [7.12.1](https://github.com/heroku/cli/compare/v7.12.0...v7.12.1) (2018-08-22)

### Bug Fixes

- rename skynet cli plugin ([4e7aa6f](https://github.com/heroku/cli/commit/4e7aa6f))

<a name="7.12.0"></a>

# [7.12.0](https://github.com/heroku/cli/compare/v7.11.0...v7.12.0) (2018-08-22)

### Bug Fixes

- rename event log plugin ([f530861](https://github.com/heroku/cli/commit/f530861))
- set npm registry explicitly ([d0815e8](https://github.com/heroku/cli/commit/d0815e8))

<a name="7.11.0"></a>

# [7.11.0](https://github.com/heroku/cli/compare/v7.10.1...v7.11.0) (2018-08-22)

**Note:** Version bump only for package heroku

<a name="7.10.1"></a>

## [7.10.1](https://github.com/heroku/cli/compare/v7.10.0...v7.10.1) (2018-08-22)

### Bug Fixes

- point sudo to [@heroku](https://github.com/heroku)/sudo ([5082fd1](https://github.com/heroku/cli/commit/5082fd1))

<a name="7.10.0"></a>

# [7.10.0](https://github.com/heroku/cli/compare/v7.9.4...v7.10.0) (2018-08-22)

### Features

- use npmjs.org registry ([#873](https://github.com/heroku/cli/issues/873)) ([2f4e748](https://github.com/heroku/cli/commit/2f4e748))

<a name="7.9.4"></a>

## [7.9.4](https://github.com/heroku/cli/compare/v7.9.3...v7.9.4) (2018-08-21)

### Bug Fixes

- updated notifier ([85ad480](https://github.com/heroku/cli/commit/85ad480))

<a name="7.9.3"></a>

## [7.9.3](https://github.com/heroku/cli/compare/v7.9.2...v7.9.3) (2018-08-18)

**Note:** Version bump only for package heroku

<a name="7.9.2"></a>

## [7.9.2](https://github.com/heroku/cli/compare/v7.9.1...v7.9.2) (2018-08-18)

### Bug Fixes

- lint issues with cli ([86e9c75](https://github.com/heroku/cli/commit/86e9c75))
- typescript 3.0 ([268c0af](https://github.com/heroku/cli/commit/268c0af))

<a name="7.9.1"></a>

## [7.9.1](https://github.com/heroku/cli/compare/v7.9.0...v7.9.1) (2018-08-17)

### Bug Fixes

- updated some dependencies ([0306f88](https://github.com/heroku/cli/commit/0306f88))

<a name="7.9.0"></a>

# [7.9.0](https://github.com/heroku/cli/compare/v7.8.1...v7.9.0) (2018-08-17)

### Features

- node 10.9.0 ([530c104](https://github.com/heroku/cli/commit/530c104))

<a name="7.8.1"></a>

## [7.8.1](https://github.com/heroku/cli/compare/v7.8.0...v7.8.1) (2018-08-17)

**Note:** Version bump only for package heroku

<a name="7.8.0"></a>

# [7.8.0](https://github.com/heroku/cli/compare/v7.7.10...v7.8.0) (2018-08-17)

**Note:** Version bump only for package heroku

<a name="7.7.10"></a>

## [7.7.10](https://github.com/heroku/cli/compare/v7.7.8...v7.7.10) (2018-08-14)

**Note:** Version bump only for package heroku

<a name="7.7.9"></a>

## [7.7.9](https://github.com/heroku/cli/compare/v7.7.8...v7.7.9) (2018-08-14)

**Note:** Version bump only for package heroku

<a name="7.7.8"></a>

## [7.7.8](https://github.com/heroku/cli/compare/v7.7.7...v7.7.8) (2018-07-30)

**Note:** Version bump only for package heroku

<a name="7.7.7"></a>

## [7.7.7](https://github.com/heroku/cli/compare/v7.7.6...v7.7.7) (2018-07-26)

**Note:** Version bump only for package heroku

<a name="7.7.6"></a>

## [7.7.6](https://github.com/heroku/cli/compare/v7.7.5...v7.7.6) (2018-07-25)

**Note:** Version bump only for package heroku

<a name="7.7.5"></a>

## [7.7.5](https://github.com/heroku/cli/compare/v7.7.4...v7.7.5) (2018-07-25)

### Bug Fixes

- node 10.7.0 ([a336cd3](https://github.com/heroku/cli/commit/a336cd3))

<a name="7.7.4"></a>

## [7.7.4](https://github.com/heroku/cli/compare/v7.7.3...v7.7.4) (2018-07-19)

**Note:** Version bump only for package heroku

<a name="7.7.3"></a>

## [7.7.3](https://github.com/heroku/cli/compare/v7.7.2...v7.7.3) (2018-07-18)

### Bug Fixes

- **autocomplete:** skip autocomplete hooks on windows ([83be305](https://github.com/heroku/cli/commit/83be305))

<a name="7.7.2"></a>

## [7.7.2](https://github.com/heroku/cli/compare/v7.7.1...v7.7.2) (2018-07-18)

**Note:** Version bump only for package heroku

<a name="7.7.1"></a>

## [7.7.1](https://github.com/heroku/cli/compare/v7.7.0...v7.7.1) (2018-07-17)

**Note:** Version bump only for package heroku

<a name="7.7.0"></a>

# [7.7.0](https://github.com/heroku/cli/compare/v7.6.1...v7.7.0) (2018-07-17)

### Features

- **cli:** add autocomplete to core ([#940](https://github.com/heroku/cli/issues/940)) ([6c58437](https://github.com/heroku/cli/commit/6c58437))

<a name="7.6.1"></a>

## [7.6.1](https://github.com/heroku/cli/compare/v7.6.0...v7.6.1) (2018-07-16)

**Note:** Version bump only for package heroku

<a name="7.6.0"></a>

# [7.6.0](https://github.com/heroku/cli/compare/v7.5.11...v7.6.0) (2018-07-12)

**Note:** Version bump only for package heroku

<a name="7.5.11"></a>

## [7.5.11](https://github.com/heroku/cli/compare/v7.5.10...v7.5.11) (2018-07-05)

### Bug Fixes

- node 10.6.0 ([fd46cff](https://github.com/heroku/cli/commit/fd46cff))

<a name="7.5.10"></a>

## [7.5.10](https://github.com/heroku/cli/compare/v7.5.9...v7.5.10) (2018-07-03)

**Note:** Version bump only for package heroku

<a name="7.5.9"></a>

## [7.5.9](https://github.com/heroku/cli/compare/v7.5.8...v7.5.9) (2018-07-02)

### Bug Fixes

- updated aws ([51ccfcf](https://github.com/heroku/cli/commit/51ccfcf))

<a name="7.5.8"></a>

## [7.5.8](https://github.com/heroku/cli/compare/v7.5.7...v7.5.8) (2018-07-02)

**Note:** Version bump only for package heroku

<a name="7.5.7"></a>

## [7.5.7](https://github.com/heroku/cli/compare/v7.5.6...v7.5.7) (2018-06-29)

**Note:** Version bump only for package heroku

<a name="7.5.6"></a>

## [7.5.6](https://github.com/heroku/cli/compare/v7.5.5...v7.5.6) (2018-06-29)

### Bug Fixes

- bump legacy and color ([a3fa970](https://github.com/heroku/cli/commit/a3fa970))
- correct docs path ([c5be976](https://github.com/heroku/cli/commit/c5be976))

<a name="7.5.5"></a>

## [7.5.5](https://github.com/heroku/cli/compare/v7.5.4...v7.5.5) (2018-06-29)

**Note:** Version bump only for package heroku

<a name="7.5.4"></a>

## [7.5.4](https://github.com/heroku/cli/compare/v7.5.3...v7.5.4) (2018-06-28)

### Bug Fixes

- move docs symlink ([5da3c1c](https://github.com/heroku/cli/commit/5da3c1c))
- updated color dependency ([3602276](https://github.com/heroku/cli/commit/3602276))
- updated commands plugin ([c4a91cc](https://github.com/heroku/cli/commit/c4a91cc))

<a name="7.5.3"></a>

## [7.5.3](https://github.com/heroku/cli/compare/v7.5.2...v7.5.3) (2018-06-28)

**Note:** Version bump only for package heroku

<a name="7.5.2"></a>

## [7.5.2](https://github.com/heroku/cli/compare/v7.5.1...v7.5.2) (2018-06-28)

### Bug Fixes

- remove brew migrator ([cb8425e](https://github.com/heroku/cli/commit/cb8425e))

<a name="7.5.1"></a>

## [7.5.1](https://github.com/heroku/cli/compare/v7.5.0...v7.5.1) (2018-06-26)

### Bug Fixes

- bump dev-cli ([fb3e41a](https://github.com/heroku/cli/commit/fb3e41a))

<a name="7.5.0"></a>

# [7.5.0](https://github.com/heroku/cli/compare/v7.4.11...v7.5.0) (2018-06-26)

### Bug Fixes

- updated command ([ad8c04d](https://github.com/heroku/cli/commit/ad8c04d))

### Features

- use node 10.5.0 ([dd40019](https://github.com/heroku/cli/commit/dd40019))

<a name="7.4.11"></a>

## [7.4.11](https://github.com/heroku/cli/compare/v7.4.10...v7.4.11) (2018-06-21)

**Note:** Version bump only for package heroku

<a name="7.4.10"></a>

## [7.4.10](https://github.com/heroku/cli/compare/v7.4.9...v7.4.10) (2018-06-21)

**Note:** Version bump only for package heroku

<a name="7.4.9"></a>

## [7.4.9](https://github.com/heroku/cli/compare/v7.4.8...v7.4.9) (2018-06-21)

**Note:** Version bump only for package heroku

<a name="7.4.8"></a>

## [7.4.8](https://github.com/heroku/cli/compare/v7.4.7...v7.4.8) (2018-06-21)

**Note:** Version bump only for package undefined

<a name="7.4.7"></a>

## [7.4.7](https://github.com/heroku/cli/compare/v7.4.6...v7.4.7) (2018-06-20)

### Bug Fixes

- remove shrinkwrap ([922aea3](https://github.com/heroku/cli/commit/922aea3))

<a name="7.4.6"></a>

## [7.4.6](https://github.com/heroku/cli/compare/v7.4.5...v7.4.6) (2018-06-20)

### Bug Fixes

- update dev-cli readme generation ([42a77bc](https://github.com/heroku/cli/commit/42a77bc))

<a name="7.4.5"></a>

## [7.4.5](https://github.com/heroku/cli/compare/v7.4.4...v7.4.5) (2018-06-20)

### Bug Fixes

- updated monorepo documentation urls ([4bb6fe0](https://github.com/heroku/cli/commit/4bb6fe0))

<a name="7.4.4"></a>

## [7.4.4](https://github.com/heroku/cli/compare/v7.4.3...v7.4.4) (2018-06-20)

### Bug Fixes

- added shrinkwrap ([c21cd6c](https://github.com/heroku/cli/commit/c21cd6c))
- do not remove shrinkwrap after packing ([5a120d6](https://github.com/heroku/cli/commit/5a120d6))
- shrinkwrap on version ([b0a155f](https://github.com/heroku/cli/commit/b0a155f))
- updated [@oclif](https://github.com/oclif)/plugin-legacy to fix certs commands ([6fa245e](https://github.com/heroku/cli/commit/6fa245e))

<a name="7.4.3"></a>

## [7.4.3](https://github.com/heroku/cli/compare/v7.4.2...v7.4.3) (2018-06-20)

### Bug Fixes

- removed unused engineStrict field ([ebdc7da](https://github.com/heroku/cli/commit/ebdc7da))

<a name="7.4.2"></a>

## [7.4.2](https://github.com/heroku/cli/compare/v7.4.1...v7.4.2) (2018-06-20)

### Bug Fixes

- **certs:** load certs commands dynamically ([c39372b](https://github.com/heroku/cli/commit/c39372b))

<a name="7.4.1"></a>

## [7.4.1](https://github.com/heroku/cli/compare/v7.4.0...v7.4.1) (2018-06-19)

**Note:** Version bump only for package heroku

<a name="7.4.0"></a>

# [7.4.0](https://github.com/heroku/cli/compare/v7.3.0...v7.4.0) (2018-06-19)

### Bug Fixes

- added stub for certs:auto:wait ([459846e](https://github.com/heroku/cli/commit/459846e))
- added typings ([eabf1a3](https://github.com/heroku/cli/commit/eabf1a3))
- config:edit help ([4c03b27](https://github.com/heroku/cli/commit/4c03b27))
- fixed bin name ([9f92fe9](https://github.com/heroku/cli/commit/9f92fe9))
- manifest ([d3842d2](https://github.com/heroku/cli/commit/d3842d2))
- quoting of newlines ([fbd6969](https://github.com/heroku/cli/commit/fbd6969))
- repo name ([c306c78](https://github.com/heroku/cli/commit/c306c78))
- updated deps ([5a87c0e](https://github.com/heroku/cli/commit/5a87c0e))
- updated deps ([eed3a1b](https://github.com/heroku/cli/commit/eed3a1b))
- updated deps ([a63a5f3](https://github.com/heroku/cli/commit/a63a5f3))
- v2 ([e9953e6](https://github.com/heroku/cli/commit/e9953e6))
- **addons:** merged https://github.com/heroku/heroku-cli-addons/pull/93 ([2fdefc5](https://github.com/heroku/cli/commit/2fdefc5))
- **addons:** merged https://github.com/heroku/heroku-cli-addons/pull/93 ([3e84b8b](https://github.com/heroku/cli/commit/3e84b8b))
- **certs:** ported https://github.com/heroku/heroku-cli-plugin-certs-v5/pull/51 ([84c2a2e](https://github.com/heroku/cli/commit/84c2a2e))
- **webhooks:** rename webhook-type to fix lint issue ([52ecf1a](https://github.com/heroku/cli/commit/52ecf1a))

### Features

- added config:get ([0a58e2d](https://github.com/heroku/cli/commit/0a58e2d))
- added notifications to pg:wait ([#182](https://github.com/heroku/cli/issues/182)) ([1ba8290](https://github.com/heroku/cli/commit/1ba8290))
- config index ([377386e](https://github.com/heroku/cli/commit/377386e))
- show acm failure reason on certs:auto ([cf36840](https://github.com/heroku/cli/commit/cf36840))
- support single key input ([ecae1b5](https://github.com/heroku/cli/commit/ecae1b5))
- **container-registry:** ported https://github.com/heroku/heroku-container-registry/pull/75 ([13f2616](https://github.com/heroku/cli/commit/13f2616))
