const prompt = require('../../../lib/prompt')
const Validate = require('./validate')

function filter (obj) {
  const ret = {}
  Object.keys(obj).filter((key) => obj[key] !== undefined).forEach((key) => { ret[key] = obj[key] })
  return ret
}

function* getNameAndRepo (args) {
  const answer = yield prompt([{
    type: 'input',
    name: 'name',
    message: 'Pipeline name',
    when () { return !args.name },
    validate (input) {
      const [valid, msg] = Validate.pipelineName(input)
      return valid || msg
    }
  }, {
    type: 'input',
    name: 'repo',
    message: 'GitHub repository to connect to (e.g. rails/rails)',
    when () { return !args.repo },
    validate (input) {
      const [valid, msg] = Validate.repoName(input)
      return valid || msg
    }
  }])

  const reply = Object.assign(filter(answer), filter(args))
  reply.name = reply.name.toLowerCase().replace(/\s/g, '-')

  return reply
}

module.exports = getNameAndRepo
