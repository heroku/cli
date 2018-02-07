heroku-apps [![Circle CI](https://circleci.com/gh/heroku/heroku-apps.svg?style=svg)](https://circleci.com/gh/heroku/heroku-apps)
===========

[![Code Climate](https://codeclimate.com/github/heroku/heroku-apps/badges/gpa.svg)](https://codeclimate.com/github/heroku/heroku-apps)
[![codecov](https://codecov.io/gh/heroku/heroku-apps/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/heroku-apps)
[![npm version](https://badge.fury.io/js/heroku-apps.svg)](https://badge.fury.io/js/heroku-apps)
[![License](https://img.shields.io/github/license/heroku/heroku-apps.svg)](https://github.com/heroku/heroku-apps/blob/master/LICENSE)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

This core plugin comes preinstalled to the [Heroku CLI](https://cli.heroku.com).

<!-- install -->
# Installing @heroku-cli/plugin-apps

with yarn:
```
$ yarn global add @heroku-cli/plugin-apps
```

or with npm:
```
$ npm install -g @heroku-cli/plugin-apps
```
<!-- installstop -->
<!-- usage -->
# Usage

```sh-session
$ heroku COMMAND
running command...
$ heroku (-v|--version|version)
@heroku-cli/plugin-apps/2.4.25 (darwin-x64) node-v9.5.0
$ heroku --help [COMMAND]
USAGE
  $ heroku COMMAND [OPTIONS]
...
```
<!-- usagestop -->
<!-- commands -->
# Command Topics

* [heroku 2fa](docs/2fa.md)
* [heroku 2fa:disable](docs/2fa/disable.md)
* [heroku 2fa:generate-recovery-codes](docs/2fa/generate-recovery-codes.md)
* [heroku apps](docs/apps.md)
* [heroku apps:create](docs/apps/create.md)
* [heroku apps:destroy](docs/apps/destroy.md)
* [heroku apps:errors](docs/apps/errors.md)
* [heroku apps:favorites](docs/apps/favorites.md)
* [heroku apps:favorites:add](docs/apps/favorites/add.md)
* [heroku apps:favorites:remove](docs/apps/favorites/remove.md)
* [heroku apps:info](docs/apps/info.md)
* [heroku apps:open](docs/apps/open.md)
* [heroku apps:rename](docs/apps/rename.md)
* [heroku apps:stacks](docs/apps/stacks.md)
* [heroku apps:stacks:set](docs/apps/stacks/set.md)
* [heroku auth](docs/auth.md)
* [heroku auth:2fa](docs/auth/2fa.md)
* [heroku auth:2fa:disable](docs/auth/2fa/disable.md)
* [heroku auth:2fa:generate](docs/auth/2fa/generate.md)
* [heroku auth:login](docs/auth/login.md)
* [heroku auth:logout](docs/auth/logout.md)
* [heroku auth:token](docs/auth/token.md)
* [heroku auth:whoami](docs/auth/whoami.md)
* [heroku buildpacks](docs/buildpacks.md)
* [heroku buildpacks:add](docs/buildpacks/add.md)
* [heroku buildpacks:clear](docs/buildpacks/clear.md)
* [heroku buildpacks:remove](docs/buildpacks/remove.md)
* [heroku buildpacks:set](docs/buildpacks/set.md)
* [heroku config](docs/config.md)
* [heroku config:get](docs/config/get.md)
* [heroku config:set](docs/config/set.md)
* [heroku config:unset](docs/config/unset.md)
* [heroku domains](docs/domains.md)
* [heroku domains:add](docs/domains/add.md)
* [heroku domains:clear](docs/domains/clear.md)
* [heroku domains:remove](docs/domains/remove.md)
* [heroku domains:wait](docs/domains/wait.md)
* [heroku drains](docs/drains.md)
* [heroku drains:add](docs/drains/add.md)
* [heroku drains:remove](docs/drains/remove.md)
* [heroku dyno](docs/dyno.md)
* [heroku dyno:kill](docs/dyno/kill.md)
* [heroku dyno:resize](docs/dyno/resize.md)
* [heroku dyno:restart](docs/dyno/restart.md)
* [heroku dyno:scale](docs/dyno/scale.md)
* [heroku dyno:stop](docs/dyno/stop.md)
* [heroku features](docs/features.md)
* [heroku features:disable](docs/features/disable.md)
* [heroku features:enable](docs/features/enable.md)
* [heroku features:info](docs/features/info.md)
* [heroku keys](docs/keys.md)
* [heroku keys:add](docs/keys/add.md)
* [heroku keys:clear](docs/keys/clear.md)
* [heroku keys:remove](docs/keys/remove.md)
* [heroku labs](docs/labs.md)
* [heroku labs:disable](docs/labs/disable.md)
* [heroku labs:enable](docs/labs/enable.md)
* [heroku labs:info](docs/labs/info.md)
* [heroku logout](docs/logout.md)
* [heroku maintenance](docs/maintenance.md)
* [heroku maintenance:off](docs/maintenance/off.md)
* [heroku maintenance:on](docs/maintenance/on.md)
* [heroku notifications](docs/notifications.md)
* [heroku ps](docs/ps.md)
* [heroku ps:kill](docs/ps/kill.md)
* [heroku ps:resize](docs/ps/resize.md)
* [heroku ps:restart](docs/ps/restart.md)
* [heroku ps:scale](docs/ps/scale.md)
* [heroku ps:stop](docs/ps/stop.md)
* [heroku ps:type](docs/ps/type.md)
* [heroku regions](docs/regions.md)
* [heroku releases](docs/releases.md)
* [heroku releases:info](docs/releases/info.md)
* [heroku releases:output](docs/releases/output.md)
* [heroku releases:rollback](docs/releases/rollback.md)
* [heroku twofactor](docs/twofactor.md)
* [heroku twofactor:disable](docs/twofactor/disable.md)
* [heroku twofactor:generate-recovery-codes](docs/twofactor/generate-recovery-codes.md)

<!-- commandsstop -->
