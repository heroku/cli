`heroku plugins`
================

list installed plugins

* [`heroku plugins`](#heroku-plugins)
* [`heroku plugins:install PLUGIN...`](#heroku-pluginsinstall-plugin)
* [`heroku plugins:link PLUGIN`](#heroku-pluginslink-plugin)
* [`heroku plugins:uninstall PLUGIN...`](#heroku-pluginsuninstall-plugin)
* [`heroku plugins:update`](#heroku-pluginsupdate)

## `heroku plugins`

list installed plugins

```
USAGE
  $ heroku plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ heroku plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.8/src/commands/plugins/index.ts)_

## `heroku plugins:install PLUGIN...`

installs a plugin into the CLI

```
USAGE
  $ heroku plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command 
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in 
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ heroku plugins:add

EXAMPLES
  $ heroku plugins:install myplugin 
  $ heroku plugins:install https://github.com/someuser/someplugin
  $ heroku plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.8/src/commands/plugins/install.ts)_

## `heroku plugins:link PLUGIN`

links a plugin into the CLI for development

```
USAGE
  $ heroku plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello' 
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ heroku plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.8/src/commands/plugins/link.ts)_

## `heroku plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
USAGE
  $ heroku plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.8/src/commands/plugins/uninstall.ts)_

## `heroku plugins:update`

update installed plugins

```
USAGE
  $ heroku plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.8/src/commands/plugins/update.ts)_
