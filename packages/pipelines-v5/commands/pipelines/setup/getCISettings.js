const prompt = require('../../../lib/prompt')

function * getCISettings (yes, organization) {
  const settings = yes ? { ci: true } : yield prompt([{
    type: 'confirm',
    name: 'ci',
    message: 'Enable automatic Heroku CI test runs?'
  }])

  if (settings.ci && organization) {
    settings.organization = organization
  }

  return settings
}

module.exports = getCISettings
