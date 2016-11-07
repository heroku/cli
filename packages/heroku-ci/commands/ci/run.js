const api = require('../../lib/heroku-api')
const cli = require('heroku-cli-util')
const co = require('co')
const got = require('got')
const spawn = require('child_process').spawn
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const tmp = Promise.promisifyAll(require('temp').track())

function * getRef () {
  const gitBranch = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'])

  return new Promise((resolve, reject) => {
    gitBranch.on('error', reject)
    gitBranch.stdout.on('data', (data) => resolve(data.toString().trim()))
  })
}

function * getBranch () {
  const gitBranch = spawn('git', ['symbolic-ref', '--short', 'HEAD'])

  return new Promise((resolve, reject) => {
    gitBranch.on('error', reject)
    gitBranch.stdout.on('data', (data) => resolve(data.toString().trim()))
  })
}

function * getCommitMessageTitleLine () {
  const gitBranch = spawn('git', ['log', '-1', '--pretty=format:%s'])

  return new Promise((resolve, reject) => {
    gitBranch.on('error', reject)
    gitBranch.stdout.on('data', (data) => resolve(data.toString().trim()))
  })
}

function * createArchive (ref) {
  const tar = spawn('git', ['archive', '--format', 'tar.gz', ref])
  const file = yield tmp.openAsync({ suffix: '.tgz' })
  const write = tar.stdout.pipe(fs.createWriteStream(file.path))

  return new Promise((resolve, reject) => {
    write.on('close', () => resolve(file.path))
    write.on('error', reject)
  })
}

function * createSource (heroku, appIdentifier) {
  return yield heroku.post(`/apps/${appIdentifier}/sources`)
}

function * uploadArchive (url, filePath) {
  const request = got.stream.put(url, {
    headers: {
      'content-length': (yield fs.statAsync(filePath)).size
    }
  })

  fs.createReadStream(filePath).pipe(request)

  return new Promise((resolve, reject) => {
    request.on('error', reject)
    request.on('response', resolve)
  })
}

function * run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const pipeline = coupling.pipeline.id
  const ref = yield getRef()
  const branch = yield getBranch()
  const commitMessage = yield getCommitMessageTitleLine()
  const filePath = yield createArchive(ref)
  const source = yield createSource(heroku, context.app)

  yield uploadArchive(source.source_blob.put_url, filePath)

  yield api.createTestRun(heroku, {
    commit_branch: branch,
    commit_message: commitMessage,
    commit_sha: ref,
    pipeline: pipeline,
    source_blob_url: source.source_blob.get_url
  })
}

module.exports = {
  topic: 'ci',
  command: 'run',
  needsApp: true,
  needsAuth: true,
  description: 'run tests against current directory',
  help: 'uploads the contents of the current directory, using git archive, to Heroku and runs the tests',
  run: cli.command(co.wrap(run))
}
