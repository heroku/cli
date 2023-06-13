'use strict'

export default {
  remoteFromGitConfig: () => Promise.resolve('heroku'),
  url: (app: any) => `https://git.heroku.com/${app}.git`,
  remoteUrl: () => Promise.resolve('https://git.heroku.com/myapp.git'),
  spawn: () => Promise.resolve(),
  exec: function (args: any[]) {
    switch (args.join(' ')) {
    case 'remote':
      return Promise.resolve('heroku')
    default:
      return Promise.resolve()
    }
  },
}
