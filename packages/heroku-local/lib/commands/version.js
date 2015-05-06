'use strict';
let Forego  = require('../forego');
let h = require('heroku-cli-util');

module.exports = {
  topic: 'local',
  command: 'version',
  description: 'display forego version',
  help: 'Display forego version',
  run: h.command(function* (ctx) {
    let forego = new Forego(ctx.herokuDir);
    yield forego.ensureSetup();
    forego.version();
  })
};
