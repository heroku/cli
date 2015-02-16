'use strict';
let fs      = require('fs');
let path    = require('path');
let request = require('request');
let spawn   = require('child_process').spawn;

function handleErr (err) {
  console.error(err.stack);
  process.exit(1);
}

function downloadForego (path, cb) {
  let url = 'https://godist.herokuapp.com/projects/ddollar/forego/releases/current/darwin-amd64/forego';
  request(url)
  .on('response', function () {
    cb();
  })
  .pipe(fs.createWriteStream(path, {
    mode: 0o0755
  }));
}

function ensureSetup (path, cb) {
  fs.open(path, 'r', function (err) {
    if (err) {
      downloadForego(path, cb);
    } else {
      cb();
    }
  });
}

function start (opts) {
  spawn('forego', ['start'], {
    cwd: opts.cwd,
    stdio: [0, 1, 2]
  });
}

module.exports = {
  topic: 'local',
  command: 'start',
  description: 'run heroku app locally',
  help: 'TODO',
  run: function (ctx) {
    var foregoPath = path.join(ctx.herokuDir, 'forego');
    ensureSetup(foregoPath, function (err) {
      if (err) { handleErr(err); }
      start({cwd: ctx.cwd});
    });
  }
};
