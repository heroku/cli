'use strict';
global.cli = require('heroku-cli-util');
cli.mockConsole();
cli.raiseErrors   = true;
cli.color.enabled = false;
let chai = require('chai');
chai.use(require('sinon-chai'));
