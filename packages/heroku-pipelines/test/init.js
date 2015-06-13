'use strict';

let cli = require('heroku-cli-util');
cli.raiseErrors = true;

let chai = require('chai');
chai.use(require('sinon-chai'));
chai.should();
