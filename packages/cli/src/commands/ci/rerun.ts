
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import * as Kolkrabbi from '@heroku-cli/plugin-ci/lib/interfaces/kolkrabbi'
import {getPipeline} from '@heroku-cli/plugin-ci/lib/utils/pipelines'
import {createSourceBlob} from '@heroku-cli/plugin-ci/lib/utils/source'
import {displayAndExit} from '@heroku-cli/plugin-ci/lib/utils/test-run'

const cli = CliUx.ux

export default class CiReRun extends Command {
  static description = 'rerun tests against current directory'

  static examples = [
    `$ heroku ci:rerun 985 --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.string({char: 'a', description: 'app name'}),
    pipeline: flags.pipeline({required: false}),
  }

  static args = [{name: 'number', required: false}]

  async run() {
    const {flags, args} = await this.parse(CiReRun)
    const pipeline = await getPipeline(flags, this)

    let sourceTestRun: Heroku.TestRun

    if (args.number) {
      const testRunResponse = await this.heroku.get<Heroku.TestRun>(`/pipelines/${pipeline.id}/test-runs/${args.number}`)
      sourceTestRun = testRunResponse.body
    } else {
      const {body: testRuns} = await this.heroku.get<Heroku.TestRun[]>(`/pipelines/${pipeline.id}/test-runs`, {headers: {Range: 'number ..; order=desc,max=1'}})
      sourceTestRun = testRuns[0]
    }

    this.log(`Rerunning test run #${sourceTestRun.number}...`)

    cli.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(sourceTestRun.commit_sha, this)
    cli.action.stop()

    const {body: pipelineRepository} = await this.heroku.get<Kolkrabbi.KolkrabbiApiPipelineRepositories>(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`)

    cli.action.start('Starting test run')
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
    cli.action.stop()

    await displayAndExit(pipeline, testRun.number!, this)
  }
}
