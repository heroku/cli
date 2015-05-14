'use strict';
global.cli = require('heroku-cli-util');
global.sinon = require('sinon');
cli.mockConsole();
cli.config.raiseErrors = true;
cli.color.enabled      = false;
let chai = require('chai');
chai.should();
