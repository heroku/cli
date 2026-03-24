import {ux} from '@oclif/core/ux'

import {HuxHelpers} from '../../hux-helpers.js'
import {pipelineName, repoName} from './validate.js'

interface GetNameAndRepoAnswer {
  name: boolean | string;
  repo: boolean | string;
}

export default async function getNameAndRepo(args: any) {
  const answer: GetNameAndRepoAnswer = {
    name: '',
    repo: '',
  }

  if (!args.name) {
    const name = await HuxHelpers.prompt('Pipeline name', {
      required: true,
    })

    const [valid, msg] = pipelineName(name)

    if (valid) {
      answer.name = name
    } else {
      ux.error(msg as string)
    }
  }

  if (!args.repo) {
    const repo = await HuxHelpers.prompt('GitHub repository to connect to (e.g. rails/rails)', {
      required: true,
    })

    const [valid, msg] = repoName(repo)
    if (valid) {
      answer.repo = repo
    } else {
      ux.error(msg as string)
    }
  }

  const reply: any = Object.assign(filter(answer), filter(args))
  reply.name = reply.name.toLowerCase().replaceAll(/\s/g, '-')

  return reply
}

function filter(obj: any) {
  const ret: any = {}
  Object.keys(obj)
    .filter((key: any) => obj[key] !== undefined)
    .forEach((key: string) => {
      ret[key] = obj[key]
    })
  return ret
}
