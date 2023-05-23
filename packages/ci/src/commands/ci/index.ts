import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import {getPipeline} from '../../utils/pipelines'
import {renderList} from '../../utils/test-run'

export default class CiIndex extends Command {
  static description = 'display the most recent CI runs for the given pipeline'

  static examples = [
    `$ heroku ci --app murmuring-headland-14719
`,
  ]

  static flags = {
    app: flags.string({char: 'a', description: 'app name'}),
    watch: flags.boolean({description: 'keep running and watch for new and update tests', required: false}),
    pipeline: flags.pipeline({required: false}),
    json: flags.boolean({description: 'output in json format', required: false}),
  }

  async run() {
    const {flags} = await this.parse(CiIndex)
    const pipeline = await getPipeline(flags, this)
    const {body: testRuns} = await this.heroku.get<Heroku.TestRun[]>(`/pipelines/${pipeline.id}/test-runs`)

    await renderList(this, testRuns, pipeline, flags.watch, flags.json)
  }
}
