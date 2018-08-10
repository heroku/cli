
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import * as Kolkrabbi from '../../interfaces/kolkrabbi'

import {getPipeline} from '../../utils/pipelines'
import {displayAndExit} from '../../utils/test-run'

import {createSourceBlob} from '../../utils/source'
import cli from 'cli-ux'

const git = require('../../utils/git')
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
    const commit = await git.readCommit('HEAD')

    cli.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this)
    // TODO: Be able to change the host
    const {body: pipelineRepository} = await this.heroku.get<Kolkrabbi.KolkrabbiApiPipelineRepositories>(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`)
    cli.done()

    cli.action.start('Starting test run')
    const organization = pipelineRepository.organization && pipelineRepository.organization.name

    try {
      const {body: testRun} = await this.heroku.post<Heroku.TestRun>('/test-runs', {body: {
        commit_branch: commit.branch,
        commit_message: commit.message,
        commit_sha: commit.ref,
        pipeline: pipeline.id,
        organization,
        source_blob_url: sourceBlobUrl
        }
      })
      cli.done()

      await displayAndExit(pipeline, testRun.number!, this)
    } catch (e) {
      this.error(e) // This currently shows a  ›   Error: Not found.
    }
  }
}
