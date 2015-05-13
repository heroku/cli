'use strict';
let child_process = require('child_process');
let h = require('heroku-cli-util');

function exec (args) {
  return new Promise(function (fulfill, reject) {
    child_process.execFile('git', args, function (error, stdout) {
      if (error) { return reject(error); }
      fulfill(stdout.trim());
    });
  });
}

function spawn (args) {
  return new Promise(function (fulfill, reject) {
    let s = child_process.spawn('git', args, {stdio: [0,1,2]});
    s.on('error', reject);
    s.on('close', fulfill);
  });
}

function remoteFromGitConfig () {
  return exec(['config', 'heroku.remote']).catch(function () {});
}

function sshGitUrl(app) {
  return `git@${h.config.git_host}:${app}.git`;
}

function httpGitUrl(app) {
  return `https://${h.config.http_git_host}/${app}.git`;
}

exports.exec = exec;
exports.spawn = spawn;
exports.remoteFromGitConfig = remoteFromGitConfig;
exports.sshGitUrl = sshGitUrl;
exports.httpGitUrl = httpGitUrl;
