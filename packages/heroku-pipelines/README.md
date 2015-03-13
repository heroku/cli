[![npm version](https://badge.fury.io/js/heroku-hello-world.svg)](http://badge.fury.io/js/heroku-hello-world)

Heroku Hello World
==================

Toolbelt 4.0 plugins are iojs npm packages that export `topics` and `commands`. You can write these yourself and try them out either by symlinking to `~/.heroku/node_modules` (good while developing) or by publishing them to npmjs.org and installing with `heroku plugins:install NPM_PACKAGE_NAME` (good for releasing).

The plugins will be run with iojs v1.1.0 no matter what version of iojs/node is installed on the machine (if any).

This is a short walkthrough to make a simple hello world plugin. For a more complete example, check out the [RedisCloud example plugin](https://github.com/heroku/heroku-rediscloud-plugin-example).

Setting up your CLI
-------------------

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

Because the Heroku CLI only installs the JavaScript dependencies on demand, you may need to setup your CLI first. Simply install a JavaScript plugin and it will setup automatically:

```
$ heroku plugins:install heroku-hello-world
```

Creating the package
--------------------

Create a new directory for your plugin and symlink it to `~/.heroku/node_modules`:

```
$ mkdir my-heroku-hello-world
$ ln -s ~/PATHTOMYPACKAGE ~/.heroku/node_modules/
```

Now you'll need to create 2 files, a `package.json` file describing the package's metadata and `index.js` which will be the plugin's code entry point.

package.json
------------

This is some metadata for the package:

```json
{
  "name": "heroku-hello-world",
  "version": "1.0.0",
  "description": "basic example heroku plugin",
  "main": "index.js",
  "author": "Jeff Dickey @dickeyxxx",
  "repository": {
    "type": "git",
    "url": "https://github.com/dickeyxxx/heroku-hello-world"
  },
  "bugs": {
    "url": "https://github.com/dickeyxxx/heroku-hello-world/issues"
  },
  "keywords": [
    "heroku-plugin"
  ],
  "license": "ISC"
}
```

Including the keyword `heroku-plugin` in `package.json` will later help us find all plugins in the wild.

index.js
--------

This is the entry point of the application where the plugin will find the plugin's code. It exposes a list of topics and commands the plugin provides. You can run this command with `heroku hello:world`.

We specified this to be the entry point in `package.json` under the `main` attribute. (Although `index.js` is the default anyways)

```js
exports.topics = [{
  name: 'hello',
  description: 'a topic for the hello world plugin'
}];

exports.commands = [
  {
    topic: 'hello',
    command: 'world',
    description: 'tells you hello',
    help: 'help text for hello:world',
    flags: [
      {name: 'user', char: 'u', description: 'user to say hello to', hasValue: true}
    ],
    run: function (context) {
      if (context.args.user) {
        console.log(`Hello, ${context.args.user}!`);
      } else {
        console.log('Hello, World!');
      }
    }
  }
];
```

Running the plugin
------------------

Now you can run the plugin with `heroku hello:world`. If it isn't working, check to make sure the plugin is being loaded by running `heroku plugins`. If it's not there, check to make sure it's symlinked to `~/.heroku/node_modules` and you have the CLI JavaScript dependencies setup (see above).

Note the help is automatically setup for `heroku help hello` and `heroku help hello:world`.
