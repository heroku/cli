'use strict'

module.exports = {
  remoteFromGitConfig: () => Promise.resolve('heroku'),
  url: app => `https://git.heroku.com/${app}.git`,
  remoteUrl: () => Promise.resolve('https://git.heroku.com/myapp.git'),
  spawn: () => Promise.resolve(),
  exec: function (args) {
    switch (args.join(' ')) {
    case 'remote':
      return Promise.resolve('heroku')
    default:
      return Promise.resolve()
    }
  },
}
