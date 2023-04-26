import * as api from '../api'

const cli = require('heroku-cli-util')

function wait(ms: any) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve: (value?: any) => void) => setTimeout(resolve, ms))
}

function pollAppSetup(heroku: any, appSetup: any): any {
  return api.getAppSetup(heroku, appSetup.id).then(({body: setup}: any) => {
    console.log('STATUS: ', setup)
    if (setup.status === 'succeeded') {
      return setup
    }

    if (setup.status === 'failed') {
      console.log('about to fail!')
      throw new Error(`Couldn't create application ${cli.color.app(setup.app.name)}: ${setup.failure_message}`)
    }

    console.log('WE DID WE MAKE IT HERE WITH: ', setup)

    return wait(1000).then(() => pollAppSetup(heroku, appSetup))
  }).catch((error: any) => {
    console.log('WE ERRORS ARE WE EXPERIENCING: ', error)
    return cli.exit(1, error)
  })
}

export default function pollAppSetups(heroku: any, appSetups: any) {
  console.log('appSetups: ', appSetups)
  return Promise.all(appSetups.map((appSetup: any) => pollAppSetup(heroku, appSetup)))
}
