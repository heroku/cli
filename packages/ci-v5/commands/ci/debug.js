const cli = require('heroku-cli-util')
const Dyno = require('@heroku-cli/plugin-run').Dyno
const co = require('co')
const api = require('../../lib/heroku-api')
const git = require('../../lib/git')
const source = require('../../lib/source')
const TestRun = require('../../lib/test-run')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

// Default command. Run setup, source profile.d scripts and open a bash session
const SETUP_COMMAND = 'ci setup && eval $(ci env)'

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)

  const pipelineRepository = yield api.pipelineRepository(heroku, pipeline.id)
  const organization = pipelineRepository.organization &&
                       pipelineRepository.organization.name

  const commit = yield git.readCommit('HEAD')
  const sourceBlobUrl = yield cli.action('Preparing source', co(function* () {
    return yield source.createSourceBlob(commit.ref, context, heroku)
  }))

  // Create test run and wait for it to transition to `debugging`
  const testRun = yield cli.action('Creating test run', co(function* () {
    const run = yield api.createTestRun(heroku, {
      commit_branch: commit.branch,
      commit_message: commit.message,
      commit_sha: commit.ref,
      debug: true,
      clear_cache: !!context.flags['no-cache'],
      organization,
      pipeline: pipeline.id,
      source_blob_url: sourceBlobUrl
    })

    return yield TestRun.waitForStates(['debugging', 'errored'], run, { heroku })
  }))

  if (testRun.status === 'errored') {
    cli.exit(1, `Test run creation failed while ${testRun.error_state} with message "${testRun.message}"`)
  }

  const appSetup = yield api.appSetup(heroku, testRun.app_setup.id)
  const noSetup = context.flags['no-setup']

  cli.log(`${noSetup ? 'Attaching' : 'Running setup and attaching'} to test dyno...`)

  if (noSetup) {
    cli.warn('Skipping test setup phase.')
    cli.warn(`Run \`${SETUP_COMMAND}\``)
    cli.warn('to execute a build and configure the environment')
  }

  const testNodes = yield api.testNodes(heroku, testRun.id)

  const dyno = new Dyno({
    heroku,
    app: appSetup.app.id,
    showStatus: false
  })

  dyno.dyno = { attach_url: Utils.dig(testNodes, 0, 'dyno', 'attach_url') }

  function sendSetup (data, connection) {
    if (data.toString().includes('$')) {
      dyno.write(SETUP_COMMAND + '\n')
      dyno.removeListener('data', sendSetup)
    }
  }

  if (!noSetup) {
    dyno.on('data', sendSetup)
  }

  try {
    yield dyno.attach()
  } catch (err) {
    if (err.exitCode) cli.exit(err.exitCode, err)
    else throw err
  }

  yield cli.action(
    'Cleaning up',
    api.updateTestRun(heroku, testRun.id, {
      status: 'cancelled',
      message: 'debug run cancelled by Heroku CLI'
    })
  )
}

module.exports = {
  topic: 'ci',
  command: 'debug',
  wantsApp: true,
  needsAuth: true,
  description: 'opens an interactive test debugging session with the contents of the current directory',
  help: `Example:

    $ heroku ci:debug
    Preparing source... done
    Creating test run... done
    Running setup and attaching to test dyno...

~ $
`,
  flags: [
    {
      name: 'no-setup',
      hasValue: false,
      description: 'start test dyno without running test-setup'
    },
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion
    },
    {
      name: 'no-cache',
      hasValue: false,
      description: 'start test run with an empty cache'
    }
  ],
  run: cli.command(co.wrap(run))
}
