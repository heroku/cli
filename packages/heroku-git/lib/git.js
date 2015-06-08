'use strict';

let child_process = require('child_process');

module.exports = function (context) {

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
    return `git@${context.gitHost}:${app}.git`;
  }

  function httpGitUrl(app) {
    return `https://${context.httpGitHost}/${app}.git`;
  }

  return {
    exec,
    spawn,
    remoteFromGitConfig,
    sshGitUrl,
    httpGitUrl
  };
};
