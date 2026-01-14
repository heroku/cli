'use strict'

export default {
  exec(args: any[]) {
    switch (args.join(' ')) {
    case 'remote': {
      return Promise.resolve('heroku')
    }

    default: {
      return Promise.resolve()
    }
    }
  },
  remoteFromGitConfig: () => Promise.resolve('heroku'),
  remoteUrl: () => Promise.resolve('https://git.heroku.com/myapp.git'),
  spawn: () => Promise.resolve(),
  url: (app: any) => `https://git.heroku.com/${app}.git`,
}
