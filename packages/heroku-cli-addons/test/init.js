'use strict';

let cli = require('heroku-cli-util');
cli.raiseErrors = true;
global.commands = require('..').commands;
