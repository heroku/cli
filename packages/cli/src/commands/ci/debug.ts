import {ux} from '@oclif/core'
import {createTestRun, getAppSetup, getTestNodes, updateTestRun} from '../../lib/api'
import {getPipeline} from '../../lib/ci/pipelines'
import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api'
import Dyno from '../../lib/run/dyno'
import Git from '../../lib/git/git'
import {createSourceBlob} from '../../lib/ci/source'
import {waitForStates} from '../../lib/ci/test-run'
import {get} from 'lodash'
import {Command, flags as cmdFlags} from '@heroku-cli/command'
import {buildCommand} from '../../lib/run/helpers'

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

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)

    const pipelineRepository = await kolkrabbi.getPipelineRepository(pipeline.id)
    const organization = pipelineRepository.organization &&
      pipelineRepository.organization.name

    const git = new Git()
    const commit = await git.readCommit('HEAD')
    ux.action.start('Preparing source')
    const sourceBlobUrl = await createSourceBlob(commit.ref, this)
    // Create test run and wait for it to transition to `debugging`
    ux.action.start('Creating test run')

    const run = await createTestRun(this.heroku, {
      commit_branch: commit.branch,
      commit_message: commit.message,
      commit_sha: commit.ref,
      debug: true,
      clear_cache: Boolean(flags['no-cache']),
      organization,
      pipeline: pipeline.id,
      source_blob_url: sourceBlobUrl,
    })

    const testRun = await waitForStates(['debugging', 'errored'], run, this)

    if (testRun.status === 'errored') {
      ux.error(`Test run creation failed while ${testRun.error_state} with message "${testRun.message}"`, {exit: 1})
    }

    const {body: appSetup} = await getAppSetup(this.heroku, testRun.app_setup?.id)
    const noSetup = flags['no-setup']

    ux.log(`${noSetup ? 'Attaching' : 'Running setup and attaching'} to test dyno...`)

    if (noSetup) {
      ux.warn('Skipping test setup phase.')
      ux.warn(`Run \`${SETUP_COMMAND}\``)
      ux.warn('to execute a build and configure the environment')
    }

    const testNodes = await getTestNodes(this.heroku, testRun.id!)

    const dyno = new Dyno({
      heroku: this.heroku,
      app: appSetup?.app?.id || '', // this should exist by here. ` || ''` is TS nudging
      showStatus: false,
      command: buildCommand(['ci:debug', 'WHAT GOES HERE? Pass flags through?']),
    })

    dyno.dyno = {attach_url: get(testNodes, [0, 'dyno', 'attach_url'])}

    function sendSetup(data: any) {
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
    } catch (error: any) {
      if (error.exitCode) ux.error(error, {exit: error.exitCode})
      else throw error
    }

    await ux.action.start('Cleaning up')
    await updateTestRun(this.heroku, testRun.id!, {
      status: 'cancelled',
      message: 'debug run cancelled by Heroku CLI',
    })
  }
}
