heroku plugins
==============


# Commands

* [heroku plugins [OPTIONS]](#plugins)
* [heroku plugins:install PLUGIN...](#pluginsinstall)
* [heroku plugins:uninstall PLUGIN...](#pluginsuninstall)
* [heroku plugins:update [OPTIONS]](#pluginsupdate)
## plugins

list installed plugins

```
USAGE
  $ heroku plugins [OPTIONS]

OPTIONS
  --core  show core plugins

EXAMPLE
  $ heroku plugins
```

_See code: [@anycli/plugin-plugins](https://github.com/anycli/plugin-plugins/blob/v0.2.14/src/commands/plugins/index.ts)_

### plugins:install

installs a plugin into the CLI

```
USAGE
  $ heroku plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  --help     show CLI help
  --version  show CLI version

EXAMPLE
  $ heroku plugins:install heroku-production-status
```

_See code: [@anycli/plugin-plugins](https://github.com/anycli/plugin-plugins/blob/v0.2.14/src/commands/plugins/install.ts)_

### plugins:uninstall

removes a plugin from the CLI

```
USAGE
  $ heroku plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  --help     show CLI help
  --version  show CLI version
```

_See code: [@anycli/plugin-plugins](https://github.com/anycli/plugin-plugins/blob/v0.2.14/src/commands/plugins/uninstall.ts)_

### plugins:update

update installed plugins

```
USAGE
  $ heroku plugins:update [OPTIONS]

OPTIONS
  --help     show CLI help
  --version  show CLI version
```

_See code: [@anycli/plugin-plugins](https://github.com/anycli/plugin-plugins/blob/v0.2.14/src/commands/plugins/update.ts)_
