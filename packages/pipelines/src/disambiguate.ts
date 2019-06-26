import {APIClient} from '@heroku-cli/command'
import {prompt} from 'inquirer'
import {isUUID} from 'validator'

import {
  findPipelineByName,
  getPipeline
} from './api'

export default async function disambiguate(heroku: APIClient, pipelineIDOrName: string) {
  let pipeline

  if (isUUID(pipelineIDOrName)) {
    pipeline = await getPipeline(heroku, pipelineIDOrName)
  } else {
    let {body: pipelines} = await findPipelineByName(heroku, pipelineIDOrName)

    if (pipelines.length === 0) {
      throw new Error('Pipeline not found')
    } else if (pipelines.length === 1) {
      pipeline = pipelines[0]
    } else {
      // Disambiguate
      let choices = pipelines.map(x => {
        return {
          name: new Date(x.created_at!).toString(),
          value: x
        }
      })

      let questions = [{
        type: 'list',
        name: 'pipeline',
        message: `Which ${pipelineIDOrName} pipeline?`,
        choices
      }]

      pipeline = await new Promise(async function (resolve, reject) {
        let answers: any = await prompt(questions)
        if (answers.pipeline) resolve(answers.pipeline)
        else reject('Must pick a pipeline')
      })
    }
  }

  return pipeline
}
