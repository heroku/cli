'use strict'

let exec = require('child_process').execFile
let fs = require('fs')

module.exports = function (context) {
  let sshGitUrl = app => `git@${context.gitHost}:${app}.git`
  let gitUrl = app => `https://${context.httpGitHost}/${app}.git`

  function git(args) {
    return new Promise(function (resolve, reject) {
      exec('git', args, function (error, stdout, stderr) {
        process.stderr.write(stderr)
        if (error) return reject(error)
        resolve(stdout)
      })
    })
  }

  function hasGitRemote(remote) {
    return git(['remote'])
      .then(remotes => remotes.split('\n'))
      .then(remotes => remotes.find(r => r === remote))
  }

  function createRemote(remote, url) {
    return hasGitRemote(remote)
      .then(exists => !exists ? git(['remote', 'add', remote, url]) : null)
  }

  function listRemotes() {
    return git(['remote', '-v'])
      .then(remotes => remotes.trim().split('\n').map(r => r.split(/\s/)))
  }

  function inGitRepo() {
    try {
      fs.lstatSync('.git')
      return true
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  function rmRemote(remote) {
    return git(['remote', 'rm', remote])
  }

  return {
    sshGitUrl,
    gitUrl,
    createRemote,
    listRemotes,
    rmRemote,
    inGitRepo,
  }
}
