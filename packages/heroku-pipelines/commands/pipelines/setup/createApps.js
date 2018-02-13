const cli = require('heroku-cli-util')
const api = require('../../../lib/api')

function createApp (heroku, {archiveURL, name, organization, pipeline, stage}) {
  const params = {
    source_blob: {url: archiveURL},
    app: {name},
    pipeline_coupling: {
      stage,
      pipeline: pipeline.id
    }
  }

  if (organization) {
    params.app.organization = organization
  } else {
    params.app.personal = true
  }

  return api.createAppSetup(heroku, params).then((setup) => setup)
}

function createApps (heroku, archiveURL, pipeline, pipelineName, stagingAppName, organization) {
  const prodAppSetupPromise = createApp(heroku, {
    archiveURL,
    pipeline,
    name: pipelineName,
    stage: 'production',
    organization
  })

  const stagingAppSetupPromise = createApp(heroku, {
    archiveURL,
    pipeline,
    name: stagingAppName,
    stage: 'staging',
    organization
  })

  const promises = [prodAppSetupPromise, stagingAppSetupPromise]

  return Promise.all(promises).then(appSetups => {
    return appSetups
  }, (error) => {
    cli.exit(1, error)
  })
}

module.exports = createApps
