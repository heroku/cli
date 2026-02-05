
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {createAppSetup} from '../../api.js'

interface CreateAppOptions {
  archiveURL: string;
  name: string;
  organization: string;
  pipeline: Heroku.Pipeline;
  stage: string;
}

function createApp(heroku: any, {archiveURL, name, organization, pipeline, stage}: CreateAppOptions) {
  const params: any = {
    app: {name},
    pipeline_coupling: {
      pipeline: pipeline.id,
      stage,
    },
    source_blob: {url: archiveURL},
  }

  if (organization) {
    params.app.organization = organization
  } else {
    params.app.personal = true
  }

  return createAppSetup(heroku, params).then(setup => setup)
}

export default function createApps(heroku: any, archiveURL: any, pipeline: any, pipelineName: any, stagingAppName: any, organization: any) {
  const prodAppSetupPromise = createApp(heroku, {
    archiveURL,
    name: pipelineName,
    organization,
    pipeline,
    stage: 'production',
  })

  const stagingAppSetupPromise = createApp(heroku, {
    archiveURL,
    name: stagingAppName,
    organization,
    pipeline,
    stage: 'staging',
  })

  const promises = [prodAppSetupPromise, stagingAppSetupPromise]

  return Promise.all(promises).then(appSetups => appSetups, error => {
    ux.error(error, {exit: 1})
  })
}
