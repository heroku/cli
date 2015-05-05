'use strict';

let spawnSync = require('child_process').spawnSync;

module.exports.getTermSize = function getTermSize() {
  let result = spawnSync('resize');
  if (result.error) {
    return { COLUMNS: '80', LINES: '24' };
  }
  let data = String(result.stdout);
  let lines = data.split('\n');
  return {
    COLUMNS: Number(lines[0].match(/^COLUMNS=([0-9]+);$/)[1]),
    LINES: Number(lines[1].match(/^LINES=([0-9]+);$/)[1])
  };
};
