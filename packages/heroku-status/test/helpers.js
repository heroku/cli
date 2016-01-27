'use strict';
process.env.TZ = 'UTC';

global.expect = require('chai').expect;
global.cli    = require('heroku-cli-util');
global.nock   = require('nock');

cli.raiseErrors   = true;
cli.color.enabled = false;
nock.disableNetConnect();
