const api = require('../../../lib/api')
const cli = require('heroku-cli-util')

function wait (ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

function pollAppSetup (heroku, appSetup) {
  return api.getAppSetup(heroku, appSetup.id).then((setup) => {
    if (setup.status === 'succeeded') {
      return setup
    }

    if (setup.status === 'failed') {
      throw new Error(`Couldn't create application ${cli.color.app(setup.app.name)}: ${setup.failure_message}`)
    }

    return wait(1000).then(() => pollAppSetup(heroku, appSetup))
  }).catch((error) => {
    return cli.exit(1, error)
  })
}

function pollAppSetups (heroku, appSetups) {
  return Promise.all(appSetups.map((appSetup) => pollAppSetup(heroku, appSetup)))
}

module.exports = pollAppSetups
