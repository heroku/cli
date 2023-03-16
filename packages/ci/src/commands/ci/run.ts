import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import * as Kolkrabbi from '../../interfaces/kolkrabbi'
import * as git from '../../utils/git'
import {getPipeline} from '../../utils/pipelines'
import {createSourceBlob} from '../../utils/source'
import {displayAndExit} from '../../utils/test-run'

const cli = CliUx.ux

export default class CiRun extends Command {
  static description = 'run tests against current directory'

  static examples = [
    `$ heroku ci:run --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.string({char: 'a', description: 'app name'}),
    pipeline: flags.pipeline({required: false}),
  }

  async run() {
    const {flags} = await this.parse(CiRun)
    const pipeline = await getPipeline(flags, this)
    const commit = await git.readCommit('HEAD')

    cli.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this)
    cli.action.stop()

    cli.action.start('Starting test run')
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
    cli.action.stop()

    await displayAndExit(pipeline, testRun.number!, this)
  }
}
