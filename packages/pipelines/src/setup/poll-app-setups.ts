import * as api from '../api'
import {CliUx} from '@oclif/core'
import color from '@heroku-cli/color'

const cli = CliUx.ux

function wait(ms: any) {
  return new Promise((resolve: (value?: any) => void) => setTimeout(resolve, ms))
}

function pollAppSetup(heroku: any, appSetup: any): any {
  return api.getAppSetup(heroku, appSetup.id).then(({body: setup}: any) => {
    if (setup.status === 'succeeded') {
      return setup
    }

    if (setup.status === 'failed') {
      throw new Error(`Couldn't create application ${color.app(setup.app.name)}: ${setup.failure_message}`)
    }

    return wait(1000).then(() => pollAppSetup(heroku, appSetup))
  }).catch((error: any) => {
    return cli.error(error, {exit: 1})
  })
}

export default function pollAppSetups(heroku: any, appSetups: any) {
  return Promise.all(appSetups.map((appSetup: any) => pollAppSetup(heroku, appSetup)))
}
