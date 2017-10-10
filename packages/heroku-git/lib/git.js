'use strict'

const cp = require('child_process')
const debug = require('debug')('git')

module.exports = function (context) {
  function wrapReject (reject) {
    return function (error) {
      if (error.code === 'ENOENT') {
        error = new Error('Git must be installed to use the Heroku CLI.  See instructions here: http://git-scm.com')
      }
      reject(error)
    }
  }

  function exec (args) {
    return new Promise(function (resolve, reject) {
      debug('exec: git %o', args)
      cp.execFile('git', args, function (error, stdout) {
        if (error) return wrapReject(reject)(error)
        resolve(stdout.trim())
      })
    })
  }

  function spawn (args) {
    return new Promise(function (resolve, reject) {
      debug('spawn: git %o', args)
      let s = cp.spawn('git', args, {stdio: [0, 1, 2]})
      s.on('error', wrapReject(reject))
      s.on('close', resolve)
    })
  }

  function remoteFromGitConfig () {
    return exec(['config', 'heroku.remote']).catch(function () {})
  }

  function sshGitUrl (app) {
    return `git@${context.gitHost}:${app}.git`
  }

  function httpGitUrl (app) {
    return `https://${context.httpGitHost}/${app}.git`
  }

  function remoteUrl (name) {
    return exec(['remote', '-v'])
    .then(function (remotes) {
      return remotes.split('\n')
      .map((r) => r.split('\t'))
      .find((r) => r[0] === name)[1]
      .split(' ')[0]
    })
  }

  function url (app, ssh) {
    return ssh ? sshGitUrl(app) : httpGitUrl(app)
  }

  return {
    exec,
    spawn,
    remoteFromGitConfig,
    remoteUrl,
    url
  }
}
