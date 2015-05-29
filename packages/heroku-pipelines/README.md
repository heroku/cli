[![npm version](https://badge.fury.io/js/heroku-hello-world.svg)](http://badge.fury.io/js/heroku-hello-world)

Heroku Hello World
==================

Toolbelt 4.0 plugins are Node.js npm packages that export `topics` and `commands`. You can write these yourself and try them out either by symlinking the plugin `heroku plugins:link .` (good while developing) or by publishing them to npmjs.org and installing with `heroku plugins:install NPM_PACKAGE_NAME` (good for releasing).

For more information on Toolbelt 4.0 plugins, check out [the project on GitHub](https://github.com/heroku/heroku-cli).

The plugins will be run with a [current version of iojs](https://github.com/heroku/heroku-cli/blob/master/plugins.go#L33) no matter what version of iojs/node is installed on the machine (if any).

This is a short walkthrough to make a simple hello world plugin. For a more complete example, check out the [RedisCloud example plugin](https://github.com/heroku/heroku-rediscloud-plugin-example).

**Note: These Node.js plugins are available in the current Ruby CLI. No need to download a separate Toolbelt 4.0 CLI.**

Creating the package
--------------------

Create a new directory for your plugin.

```
$ mkdir my-heroku-hello-world
```

Now you'll need to create 3 files, a `package.json` file describing the package's metadata, `index.js` which will be the plugin's code entry point, and `commands/hello/world.js` which is the first command for this plugin.

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
    "url": "https://github.com/heroku/heroku-hello-world"
  },
  "bugs": {
    "url": "https://github.com/heroku/heroku-hello-world/issues"
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

This is the entry point of the application where the plugin will find the plugin's code. It exposes a list of topics and commands the plugin provides.

We specified this to be the entry point in `package.json` under the `main` attribute. (Although `index.js` is the default anyways)

```js
'use strict';
exports.topic = {
  name: 'hello',
  description: 'a topic for the hello world plugin'
};

exports.commands = [
  require('./commands/hello/world.js')
];
```

commands/hello/world.js
-----------------------

Now create the command at `commands/hello/world.js`:

```js
'use strict';
module.exports = {
  topic: 'hello',
  command: 'world',
  description: 'tells you hello',
  help: 'help text for hello:world',
  run: function (context) {
    console.log('Hello, World!');
  }
};
```

Using command line flags
------------------------

One way to get input from the user for a command is to declare a flag. In our case, we'll add a `--user` flag to get the user's name.

```js
'use strict';
module.exports = {
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
};
```

Run `heroku plugins:link` to refresh the plugin metadata then `heroku hello:world --user=jeff` to test the flag.

Warnings
--------

heroku-cli-util is an npm package with a set of various helpers useful for building plugins. One example helper that it includes is warning and error helpers.

First install the library:

```
$ npm install --save heroku-cli-util
```

Then use it in any plugin code:

```js
'use strict';
let cli = require('heroku-cli-util');
cli.warning('this is a warning message!');
cli.error('this is an error message!');
```

[See the readme for heroku-cli-util for more documentation.](https://github.com/heroku/heroku-cli-util)

Installing the plugin
---------------------

While plugins on npmjs.org can be installed with `heroku plugins:install`, developing plugins locally you will want to use `heroku plugins:link .`. This will symlink the plugin into `~/.heroku/node_modules`, validate the plugin actually outputs a command without errors, and refreshes the plugin cache.

Metadata about a plugin (such as flags, arguments, help text) will be cached until the plugin is linked again. For this reason you may need to run `heroku plugins:link .` again if you change plugin code. Any code inside the `run` section of a command will not need to be re-cached.

To setup this plugin locally, go to the root of your plugin directory and link the plugin:

```
$ heroku plugins:link .
symlinked heroku-hello-world
Updating plugin cache... done
```

Using the Heroku API
--------------------

To use the Heroku API, we'll add a new command to this plugin to get information about an app. First, reference the command from `index.js`:

```js
'use strict';
exports.topic = {
  name: 'hello',
  description: 'a topic for the hello world plugin'
};

exports.commands = [
  require('./commands/hello/world.js'),
  require('./commands/hello/app.js')
];
```

Now we can use the properties `needsApp` and `needsAuth` to get an app name and API key, respectively. These will be available in the context object. The CLI will ensure there is an app context (from git remote, HEROKU\_APP or from --app) and the user is logged in.

```js
'use strict';
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: function (context) {
    cli.debug(context);
  }
};
```

Install `heroku-cli-util` if you haven't already and re-link the plugin to reset the cache:

```
$ npm install --save heroku-cli-util
$ heroku plugins:link
```

Now you can see the current app is available at `context.app`. The Heroku API key is available at `context.auth.password`. You could use this to create an instance of [heroku-client](https://www.npmjs.com/package/heroku-client) yourself, but [heroku-cli-util](https://www.npmjs.com/package/heroku-cli-util) comes with a helper to make that easier. In addition, the helper will perform some error handling to prompt for 2fa tokens and show cleaner error messages from the API.

Add the following to get the app info from the API:

```js
'use strict';
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function (context, heroku) {
    // heroku is an instance of heroku-client
    heroku.apps(context.app).info(function (err, app) {
      if (err) { throw err; }
      cli.debug(app);
    });
  })
};
```

Preventing callback hell
------------------------

The code above works, but when you need to make many sequential API requests, it can make the code verbose. For instance, if we wanted to list out the config vars for the app as well, we would have to next another callback function as well as check for errors:

```js
'use strict';
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function (context, heroku) {
    heroku.apps(context.app).info(function (err, app) {
      if (err) { throw err; }
      cli.debug(app);
      heroku.apps(context.app).configVars().info(function (err, config) {
        if (err) { throw err; }
        cli.debug(config);
      });
    });
  })
};
```

This can quickly become untenable. To make this easier, `heroku-client` will return a promise when it is not called with a function callback. Here is the same code instead with promises:

```js
'use strict';
let cli = require('heroku-cli-util');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function (context, heroku) {
    return heroku.apps(context.app).info()
    .then(function (app) {
      cli.debug(app);
      return heroku.apps(context.app).configVars().info();
    })
    .then(function (config) {
      cli.debug(config);
    });
  })
};
```

In addition to having a flatter structure, by returning the promise in the main run function, we will allow `cli.command()` to cleanly handle any API error that comes up.

Using Generators with co
------------------------

To continue cleaning up our asynchronous code, we can use [co](https://www.npmjs.com/package/co) which takes advantage of ES6 generators to write asynchronous code that appears synchronous.

First install `co`:

```
$ npm install --save co
```

Then use `co` to wrap your commands and replace the promise `then`s with `yield` calls:

```js
'use strict';
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'hello',
  command: 'app',
  description: 'tells you hello',
  help: 'help text for hello:world',
  needsApp: true,
  needsAuth: true,
  run: cli.command(function (context, heroku) {
    return co(function* () {
      let app = yield heroku.apps(context.app).info();
      cli.debug(app);
      let config = yield heroku.apps(context.app).configVars().info();
      cli.debug(config);
    });
  })
};
```

This code runs the same as before just reads more nicely. Most plugins will be written using `co` and generators like this.

Running the plugin
------------------

Now that you have linked the plugin, you can run it with `heroku hello:world`. sure the plugin is being loaded by running `heroku plugins`. If it's not there, check to make sure it's symlinked to `~/.heroku/node_modules` and you have the CLI JavaScript dependencies setup (see above).

Note the help is automatically setup for `heroku help hello` and `heroku help hello:world`.

Default command
---------------

If you want a command to be used as the default command for a topic (so it could be run as `heroku hello`, for example), you can set the `default` property to true:

```js
module.exports = {
  topic: 'hello',
  command: 'world',
  default: true,
  // ...
};
```

Alternatively, you can leave out the command property completely. This would be useful if you didn't want to have 2 ways to access the same command such as [heroku-fork](https://github.com/heroku/heroku-fork).

All command options
-------------------

Here is an example command with all available command options.

```js
module.exports = {
  topic: 'kitchen',
  command: 'sink',
  description: 'example command with many options set', // short help when listing many commands
  help: // put long help and examples here `
  Example kitchen sink plugin.

Examples:

  $ heroku kitchen:sink large-pot --temperature=110 --drain
`,
  default: true,    // use `heroku kitchen` or `heroku kitchen:sink`
  hidden: true,     // hide in help
  needsApp: true,   // needs an app context (--app or Heroku git remote) `context.app`
  needsToken: true, // needs to be logged into Heroku. Allows `cli.command` to return API instance
  flags: [
    {
      // get this flag value with `context.flags.temperature`
      name: 'temperature',  // --temperature
      char: 't',            // -t
      hasValue: true        // flag expects a value to be provided (such as --temperature=110)
      description: 'temperature of faucet' // help text
    },
    {
      // get this flag value with `context.flags.drain`
      name: 'drain',  // --drain
      char: 'd',      // -d
      hasValue: true  // flag is just a boolean value
      description: 'drain sink' // help text
    }
  ],

  // set variableArgs to true if your command needs a variable amount of arguments.
  // if true, ignores anything in the `args` array and does no argument validation.
  variableArgs: false,

  args: [
    {
      // get this argument with `context.args.DISH`
      name: 'DISH',   // name of argument
      optional: true, // argument can be empty
      hidden: true    // do not show argument in help
      // args have no description. Use the command help for this.
    }
  ],
  run: function (context) { }
};
```
