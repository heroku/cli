'use strict';

global.cli = require('heroku-cli-util');
global.commands = require('..').commands;
global.expect   = require('chai').expect;
global.nock     = require('nock');
cli.raiseErrors = true;
