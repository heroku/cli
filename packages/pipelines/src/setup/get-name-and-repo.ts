import {prompt} from 'inquirer'

import * as Validate from './validate'

function filter(obj: any) {
  const ret: any = {}
  Object.keys(obj).filter((key: any) => obj[key] !== undefined).forEach((key: string) => { ret[key] = obj[key] })
  return ret
}

export default async function getNameAndRepo(args: any) {
  const answer = await prompt([{
    type: 'input',
    name: 'name',
    message: 'Pipeline name',
    when() { return !args.name },
    validate(input) {
      const [valid, msg] = Validate.pipelineName(input)
      return valid || msg
    }
  }, {
    type: 'input',
    name: 'repo',
    message: 'GitHub repository to connect to (e.g. rails/rails)',
    when() { return !args.repo },
    validate(input) {
      const [valid, msg] = Validate.repoName(input)
      return valid || msg
    }
  }])

  const reply: any = Object.assign(filter(answer), filter(args))
  reply.name = reply.name.toLowerCase().replace(/\s/g, '-')

  return reply
}
