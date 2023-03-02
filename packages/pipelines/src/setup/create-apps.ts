
import Heroku from '@heroku-cli/schema'
import cli from 'cli-ux'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import http from 'http-call'

import {createAppSetup} from '../api'

interface CreateAppOptions {
  archiveURL: string;
  name: string;
  organization: string;
  pipeline: Heroku.Pipeline;
  stage: string;
}

function createApp(heroku: any, {archiveURL, name, organization, pipeline, stage}: CreateAppOptions) {
  const params: any = {
    source_blob: {url: archiveURL},
    app: {name},
    pipeline_coupling: {
      stage,
      pipeline: pipeline.id,
    },
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
    pipeline,
    name: pipelineName,
    stage: 'production',
    organization,
  })

  const stagingAppSetupPromise = createApp(heroku, {
    archiveURL,
    pipeline,
    name: stagingAppName,
    stage: 'staging',
    organization,
  })

  const promises = [prodAppSetupPromise, stagingAppSetupPromise]

  return Promise.all(promises).then(appSetups => {
    return appSetups
  }, error => {
    cli.error(error, {exit: 1})
  })
}
