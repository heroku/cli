import * as api from '../api'

const cli = require('heroku-cli-util')

type CreateAppOptions = {
  archiveURL: any,
  name: any,
  organization: any,
  pipeline: any,
  stage: any
}

function createApp(heroku: any, {archiveURL, name, organization, pipeline, stage}: CreateAppOptions) {
  const params: any = {
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

  return api.createAppSetup(heroku, params).then(setup => setup)
}

export default function createApps(heroku: any, archiveURL: any, pipeline: any, pipelineName: any, stagingAppName: any, organization: any) {
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
  }, error => {
    cli.exit(1, error)
  })
}
