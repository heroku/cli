import cli from 'heroku-cli-util'
import {getPipeline} from '../../lib/ci/pipelines'
import Dyno from '../../lib/run/dyno'
import api from '@heroku-cli/plugin-ci-v5/lib/heroku-api'
import Git from '../../lib/git/git'
import {createSourceBlob} from '../../lib/ci/source'
import * as TestRun from '../../lib/ci/test-run'
import Utils from '@heroku-cli/plugin-ci-v5/lib/utils'
import {Command, flags as cmdFlags} from '@heroku-cli/command'

// Default command. Run setup, source profile.d scripts and open a bash session
const SETUP_COMMAND = 'ci setup && eval $(ci env)'

export default class Debug extends Command {
  static description = 'opens an interactive test debugging session with the contents of the current directory'

  static help = `Example:

    $ heroku ci:debug
    Preparing source... done
    Creating test run... done
    Running setup and attaching to test dyno...

~ $
`
  static flags = {
    app: cmdFlags.app(),
    'no-cache': cmdFlags.boolean({description: 'start test run with an empty cache'}),
    'no-setup': cmdFlags.boolean({description: 'start test dyno without running test-setup'}),
    pipeline: cmdFlags.pipeline(),
  }

  static topic = 'ci'
  async run() {
    const {flags} = await this.parse(Debug)
    const pipeline = await getPipeline(flags, this)

    const pipelineRepository = await api.pipelineRepository(this.heroku, pipeline.id)
    const organization = pipelineRepository.organization &&
      pipelineRepository.organization.name

    const git = new Git()
    const commit = await git.readCommit('HEAD')
    const sourceBlobUrl = await cli.action('Preparing source', (async () => {
      return await createSourceBlob(commit.ref, this)
    })())

    // Create test run and wait for it to transition to `debugging`
    const testRun = await cli.action('Creating test run', (async () => {
      const run = await api.createTestRun(this.heroku, {
        commit_branch: commit.branch,
        commit_message: commit.message,
        commit_sha: commit.ref,
        debug: true,
        clear_cache: Boolean(flags['no-cache']),
        organization,
        pipeline: pipeline.id,
        source_blob_url: sourceBlobUrl,
      })

      return await TestRun.waitForStates(['debugging', 'errored'], run, {heroku: this.heroku})
    })())

    if (testRun.status === 'errored') {
      cli.exit(1, `Test run creation failed while ${testRun.error_state} with message "${testRun.message}"`)
    }

    const appSetup = await api.appSetup(this.heroku, testRun.app_setup.id)
    const noSetup = flags['no-setup']

    cli.log(`${noSetup ? 'Attaching' : 'Running setup and attaching'} to test dyno...`)

    if (noSetup) {
      cli.warn('Skipping test setup phase.')
      cli.warn(`Run \`${SETUP_COMMAND}\``)
      cli.warn('to execute a build and configure the environment')
    }

    const testNodes = await api.testNodes(this.heroku, testRun.id)

    const dyno = new Dyno({
      heroku: this.heroku,
      app: appSetup.app.id,
      showStatus: false,
    })

    dyno.dyno = {attach_url: Utils.dig(testNodes, 0, 'dyno', 'attach_url')}

    function sendSetup(data) {
      if (data.toString().includes('$')) {
        dyno.write(SETUP_COMMAND + '\n')
        dyno.removeListener('data', sendSetup)
      }
    }

    if (!noSetup) {
      dyno.on('data', sendSetup)
    }

    try {
      await dyno.attach()
    } catch (error) {
      if (error.exitCode) cli.exit(error.exitCode, error)
      else throw error
    }

    await cli.action(
      'Cleaning up',
      api.updateTestRun(this.heroku, testRun.id, {
        status: 'cancelled',
        message: 'debug run cancelled by Heroku CLI',
      }),
    )
  }
}
