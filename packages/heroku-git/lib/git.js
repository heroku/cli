'use strict';
let child_process = require('child_process');

function exec (cmd) {
  return new Promise(function (fulfill, reject) {
    child_process.exec(`git ${cmd}`, function (error, stdout) {
      if (error) { return reject(error); }
      fulfill(stdout.trim());
    });
  });
}

function remoteFromGitConfig () {
  return exec('config heroku.remote').catch(function () {});
}

exports.exec = exec;
exports.remoteFromGitConfig = remoteFromGitConfig;
