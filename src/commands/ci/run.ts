import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {gitService} from '../../lib/ci/git.js'
import {getPipeline} from '../../lib/ci/pipelines.js'
import {createSourceBlob} from '../../lib/ci/source.js'
import {displayAndExit} from '../../lib/ci/test-run.js'

export default class CiRun extends Command {
  static description = 'run tests against current directory'
  static examples = [
    color.command(`heroku ci:run --app murmuring-headland-14719
`),
  ]
  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({required: false}),
    remote: flags.remote(),
  }

  async run() {
    const {flags} = await this.parse(CiRun)
    const pipeline = await getPipeline(flags, this.heroku)
    const commit = await gitService.readCommit('HEAD')

    ux.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this)
    ux.action.stop()

    ux.action.start('Starting test run')
    const {body: fullPipeline} = await this.heroku.get<Heroku.Pipeline>(`/pipelines/${pipeline.id}`, {headers: {Accept: 'application/vnd.heroku+json; version=3.pipelines'}})
    const organization = fullPipeline.owner?.type === 'team' ? (fullPipeline.owner.name ?? fullPipeline.owner.id) : undefined
    const {body: testRun} = await this.heroku.post<Heroku.TestRun>('/test-runs', {
      body: {
        commit_branch: commit.branch,
        commit_message: commit.message,
        commit_sha: commit.ref,
        organization,
        pipeline: pipeline.id,
        source_blob_url: sourceBlobUrl,
      },
    })
    ux.action.stop()

    await displayAndExit(pipeline, testRun.number!, this)
  }
}
