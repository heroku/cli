`heroku plugins`
================

List installed plugins.

* [`heroku plugins`](#heroku-plugins)
* [`heroku plugins:install PLUGIN...`](#heroku-pluginsinstall-plugin)
* [`heroku plugins:inspect PLUGIN...`](#heroku-pluginsinspect-plugin)
* [`heroku plugins:install PLUGIN...`](#heroku-pluginsinstall-plugin-1)
* [`heroku plugins:link PLUGIN`](#heroku-pluginslink-plugin)
* [`heroku plugins:uninstall PLUGIN...`](#heroku-pluginsuninstall-plugin)
* [`heroku plugins:uninstall PLUGIN...`](#heroku-pluginsuninstall-plugin-1)
* [`heroku plugins:uninstall PLUGIN...`](#heroku-pluginsuninstall-plugin-2)
* [`heroku plugins:update`](#heroku-pluginsupdate)

## `heroku plugins`

List installed plugins.

```
USAGE
  $ heroku plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ heroku plugins
```

## `heroku plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ heroku plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
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

## `heroku plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ heroku plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

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

## `heroku plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ heroku plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
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

## `heroku plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ heroku plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ heroku plugins:link myplugin
```

## `heroku plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove
```

## `heroku plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove
```

## `heroku plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ heroku plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ heroku plugins:unlink
  $ heroku plugins:remove
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
