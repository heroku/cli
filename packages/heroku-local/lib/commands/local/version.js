'use strict';
let Forego  = require('../../forego');

function handleErr (err) {
  console.error(err.stack);
  process.exit(1);
}

module.exports = {
  topic: 'local',
  command: 'version',
  description: 'display forego version',
  help: 'Display forego version',
  run: function (ctx) {
    let forego = new Forego(ctx.herokuDir);
    forego.ensureSetup(function (err) {
      if (err) { handleErr(err); }
      forego.version();
    });
  }
};
