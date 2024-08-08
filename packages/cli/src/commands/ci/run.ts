import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import * as Kolkrabbi from '../../lib/ci/interfaces/kolkrabbi'
import * as git from '../../lib/ci/git'
import {getPipeline} from '../../lib/ci/pipelines'
import {createSourceBlob} from '../../lib/ci/source'
import {displayAndExit} from '../../lib/ci/test-run'

export default class CiRun extends Command {
  static description = 'run tests against current directory'

  static examples = [
    `$ heroku ci:run --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.string(),
    remote: flags.remote(),
    pipeline: flags.pipeline({required: false}),
  }

  async run() {
    const {flags} = await this.parse(CiRun)
    const pipeline = await getPipeline(flags, this.heroku)
    const commit = await git.readCommit('HEAD')

    ux.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this)
    ux.action.stop()

    ux.action.start('Starting test run')
    const {body: pipelineRepository} = await this.heroku.get<Kolkrabbi.KolkrabbiApiPipelineRepositories>(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`)
    const organization = pipelineRepository.organization && pipelineRepository.organization.name
    const {body: testRun} = await this.heroku.post<Heroku.TestRun>('/test-runs', {body: {
      commit_branch: commit.branch,
      commit_message: commit.message,
      commit_sha: commit.ref,
      pipeline: pipeline.id,
      organization,
      source_blob_url: sourceBlobUrl,
    },
    })
    ux.action.stop()

    await displayAndExit(pipeline, testRun.number!, this)
  }
}
