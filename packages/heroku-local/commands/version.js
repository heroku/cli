'use strict';

let Forego  = require('../lib/forego');
let cli = require('heroku-cli-util');

function* run (context) {
  let forego = new Forego(context.herokuDir);
  yield forego.ensureSetup();
  forego.version();
}

module.exports = {
  topic: 'local',
  command: 'version',
  description: 'display forego version',
  help: 'Display forego version',
  run: cli.command(run)
};
