import {Command, flags} from '@heroku-cli/command'

import {createSourceBlob} from '../../lib/utils/source'
import {displayTestRunInfo} from '../../lib/utils/test-run'

import {getPipeline} from '../../lib/utils/pipelines'

import {readCommit} from '../../lib/utils/git'

import * as Kolkrabbi from '../../interfaces/kolkrabbi'

export default class CiRun extends Command {
  static description = 'run tests against current directory'

  static examples = [
    `$ heroku ci:run --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.app({required: false}),
    pipeline: flags.pipeline({required: false})
  }

  async run() {
    const {flags} = this.parse(CiRun)
    const pipeline = await getPipeline(flags, this)
    const commit = await readCommit('HEAD')

    this.log('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this.heroku)
    const {body: pipelineRepository} = await this.heroku.get<Kolkrabbi.KolkrabbiApiPipelineRepositories>(`/pipelines/${pipeline.id}/repository`, {hostname: 'https://kolkrabbi.heroku.com'})
    const organization = pipelineRepository.organization && pipelineRepository.organization.name

    this.log('Starting test run')

    const {body: testRun} = this.heroku.post('/test-runs', {body: {
        commit_branch: commit.branch,
        commit_message: commit.message,
        commit_sha: commit.ref,
        pipeline: pipeline.id,
        organization,
        source_blob_url: sourceBlobUrl
      }
    })

  // return yield TestRun.displayAndExit(pipeline, testRun.number, { heroku })
  }
}
