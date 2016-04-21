'use strict';

global.commands = require('../index').commands; // Load plugin commands
global.cli = require('heroku-cli-util');        // Load heroku-cli-util helpers
global.expect = require('chai').expect;         // Load chai
global.nock = require('nock');                  // Load nock

process.env.TZ  = 'UTC';                        // Use UTC time always
cli.raiseErrors = true;                         // Fully raise exceptions
require('mockdate').set(new Date());            // Freeze time
process.stdout.columns = 80;                    // Set screen width for consistent wrapping
process.stderr.columns = 80;                    // Set screen width for consistent wrapping
