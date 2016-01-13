'use strict';

let exec = require('child_process').execFile;

module.exports = function (context) {
  let sshGitUrl = app => `git@${context.gitHost}:${app}.git`;
  let gitUrl    = app => `https://${context.httpGitHost}/${app}.git`;

  function git (args) {
    return new Promise(function (fulfill, reject) {
      exec('git', args, function (error, stdout, stderr) {
        process.stderr.write(stderr);
        if (error) return reject(error);
        fulfill(stdout);
      });
    });
  }

  function hasGitRemote (remote) {
    return git(['remote'])
    .then(remotes => remotes.split('\n'))
    .then(remotes => remotes.find(r => r === remote));
  }

  function createRemote (remote, url) {
    return hasGitRemote(remote)
    .then(exists => !exists ? git(['remote', 'add', remote, url]) : console.log('exists'));
  }

  return {
    sshGitUrl,
    gitUrl,
    createRemote,
  };
};
