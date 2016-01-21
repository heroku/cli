'use strict';
process.env.TZ = 'UTC';
global.cli = require('heroku-cli-util');
cli.raiseErrors   = true;
cli.color.enabled = false;
