'use strict'

module.exports = {
  remoteFromGitConfig: () => Promise.resolve('heroku'),
  httpGitUrl: (app) => `https://git.heroku.com/${app}.git`,
  sshGitUrl: (app) => `git@heroku.com:${app}.git`,
  spawn: () => Promise.resolve(),
  exec: function (args) {
    switch (args.join(' ')) {
      case 'remote':
        return Promise.resolve('heroku')
      default:
        return Promise.resolve()
    }
  }
}
