import {expect, test} from '@oclif/test'
import cli from 'cli-ux'

describe('pipelines:promote', () => {
  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline'
  }

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    pipeline
  }

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    pipeline
  }

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    pipeline
  }

  const targetReleaseWithOutput = {
    id: '123-target-release-456',
    output_stream_url: 'https://busl.example/release'
  }

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline,
    stage: 'staging'
  }

  const targetCoupling1 = {
    app: targetApp1,
    id: '123-target-app-456',
    pipeline,
    stage: 'production'
  }

  const targetCoupling2 = {
    app: targetApp2,
    id: '456-target-app-789',
    pipeline,
    stage: 'production'
  }

  const promotion = {
    id: '123-promotion-456',
    source: {app: sourceApp},
    status: 'pending'
  }
})
