`heroku plugins`
================

List installed plugins.

* [`heroku plugins`](#heroku-plugins)
* [`heroku plugins:add PLUGIN`](#heroku-pluginsadd-plugin)
* [`heroku plugins:inspect PLUGIN...`](#heroku-pluginsinspect-plugin)
* [`heroku plugins:install PLUGIN`](#heroku-pluginsinstall-plugin)
* [`heroku plugins:link PATH`](#heroku-pluginslink-path)
* [`heroku plugins:remove [PLUGIN]`](#heroku-pluginsremove-plugin)
* [`heroku plugins:reset`](#heroku-pluginsreset)
* [`heroku plugins:uninstall [PLUGIN]`](#heroku-pluginsuninstall-plugin)
* [`heroku plugins:unlink [PLUGIN]`](#heroku-pluginsunlink-plugin)
* [`heroku plugins:update`](#heroku-pluginsupdate)

## `heroku plugins`

List installed plugins.

```
USAGE
  $ heroku plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ heroku plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/index.ts)_

## `heroku plugins:add PLUGIN`

Installs a plugin into heroku.

```
USAGE
  $ heroku plugins:add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into heroku.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HEROKU_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HEROKU_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ heroku plugins:add

EXAMPLES
  Install a plugin from npm registry.

    $ heroku plugins:add myplugin

  Install a plugin from a github url.

    $ heroku plugins:add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ heroku plugins:add someuser/someplugin
```

## `heroku plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ heroku plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ heroku plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/inspect.ts)_

## `heroku plugins:install PLUGIN`

Installs a plugin into heroku.

```
USAGE
  $ heroku plugins:install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into heroku.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HEROKU_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HEROKU_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ heroku plugins:add

EXAMPLES
  Install a plugin from npm registry.

    $ heroku plugins:install myplugin

  Install a plugin from a github url.

    $ heroku plugins:install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ heroku plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/install.ts)_

## `heroku plugins:link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ heroku plugins:link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ heroku plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/link.ts)_

## `heroku plugins:remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove

EXAMPLES
  $ heroku plugins:remove myplugin
```

## `heroku plugins:reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ heroku plugins:reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/reset.ts)_

## `heroku plugins:uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove

EXAMPLES
  $ heroku plugins:uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/uninstall.ts)_

## `heroku plugins:unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove

EXAMPLES
  $ heroku plugins:unlink myplugin
```

## `heroku plugins:update`

Update installed plugins.

```
USAGE
  $ heroku plugins:update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.38/src/commands/plugins/update.ts)_
