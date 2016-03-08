'use strict';

global.commands = require('../index').commands; // Load plugin commands
global.cli = require('heroku-cli-util');        // Load heroku-cli-util helpers
global.expect = require('chai').expect;         // Load chai
global.nock = require('nock');                  // Load nock

process.env.TZ    = 'UTC';                      // Use UTC time always
cli.raiseErrors   = true;                       // Fully raise exceptions
cli.color.enabled = false;                      // Disable color
