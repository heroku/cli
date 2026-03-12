import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import inquirer from 'inquirer'

import {
  findPipelineByName,
  getPipeline,
} from '../api.js'
import {uuidValidate} from '../utils/uuid-validate.js'

export default async function disambiguate(heroku: APIClient, pipelineIDOrName: string): Promise<Heroku.Pipeline> {
  let pipeline: Heroku.Pipeline

  if (uuidValidate(pipelineIDOrName)) {
    const result = (await getPipeline(heroku, pipelineIDOrName))
    pipeline = result.body
  } else {
    const {body: pipelines} = await findPipelineByName(heroku, pipelineIDOrName)

    if (pipelines.length === 0) {
      throw new Error('Pipeline not found')
    } else if (pipelines.length === 1) {
      pipeline = pipelines[0]
    } else {
      // Disambiguate
      const choices = pipelines.map(x => ({
        name: new Date(x.created_at!).toString(),
        value: x,
      }))

      const questions = [{
        choices,
        message: `Which ${pipelineIDOrName} pipeline?`,
        name: 'pipeline',
        type: 'list',
      }]

      // eslint-disable-next-line no-async-promise-executor
      pipeline = await new Promise(async (resolve, reject) => {
        const answers: any = await inquirer.prompt(questions)
        if (answers.pipeline) {
          resolve(answers.pipeline)
        } else {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('Must pick a pipeline')
        }
      })
    }
  }

  return pipeline
}
