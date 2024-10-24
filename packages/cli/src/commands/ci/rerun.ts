
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import * as Kolkrabbi from '../../lib/ci/interfaces/kolkrabbi'
import {getPipeline} from '../../lib/ci/pipelines'
import {createSourceBlob} from '../../lib/ci/source'
import {displayAndExit} from '../../lib/ci/test-run'

export default class CiReRun extends Command {
  static description = 'rerun tests against current directory'

  static examples = [
    `$ heroku ci:rerun 985 --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({required: false}),
  }

  static args = {
    number: Args.string({required: false, description: 'auto-incrementing test run number'}),
  }

  async run() {
    const {flags, args} = await this.parse(CiReRun)
    const pipeline = await getPipeline(flags, this.heroku)

    let sourceTestRun: Heroku.TestRun

    if (args.number) {
      const testRunResponse = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args.number}`)
      sourceTestRun = testRunResponse.body
    } else {
      const {body: testRuns} = await this.heroku.get<Heroku.TestRun[]>(`/pipelines/${pipeline.id}/test-runs`, {headers: {Range: 'number ..; order=desc,max=1'}})
      sourceTestRun = testRuns[0]
    }

    this.log(`Rerunning test run #${sourceTestRun.number}...`)

    ux.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(sourceTestRun.commit_sha, this)
    ux.action.stop()

    const {body: pipelineRepository} = await this.heroku.get<Kolkrabbi.KolkrabbiApiPipelineRepositories>(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`)

    ux.action.start('Starting test run')
    const organization = pipelineRepository.organization && pipelineRepository.organization.name

    const {body: testRun} = await this.heroku.post<Heroku.TestRun>('/test-runs', {body: {
      commit_branch: sourceTestRun.commit_branch,
      commit_message: sourceTestRun.commit_message,
      commit_sha: sourceTestRun.commit_sha,
      pipeline: pipeline.id,
      organization,
      source_blob_url: sourceBlobUrl,
    },
    })
    ux.action.stop()

    await displayAndExit(pipeline, testRun.number!, this)
  }
}
