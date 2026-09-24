import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {WaitForReleaseOptions, WaitForReleaseResult} from '@heroku/sdk/extensions/platform'
import {expect} from 'chai'
import {SinonStub, stub} from 'sinon'

import PsWait from '../../../../src/commands/ps/wait.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('heroku ps:wait', function () {
  const APP_NAME = 'wubalubadubdub'

  let sdkMock: MockSDK
  let waitForReleaseStub: SinonStub

  beforeEach(function () {
    waitForReleaseStub = stub()
    sdkMock = mockSDKPlatform({dyno: {waitForRelease: waitForReleaseStub}})
  })

  afterEach(function () {
    sdkMock.restore()
  })

  it('warns and exits 0 if no releases', async function () {
    waitForReleaseStub.resolves()

    const {stderr} = await runCommand(PsWait, ['--app', APP_NAME])

    expect(stderr).to.include(`Warning: App ⬢ ${APP_NAME} has no releases`)
  })

  it('renders no output when the app is already on the latest release', async function () {
    waitForReleaseStub.resolves({total: 1, version: 23})

    const {stderr} = await runCommand(PsWait, ['--app', APP_NAME])

    expect(stderr).to.be.empty
  })

  it('renders progress from onPoll and a final done line on convergence', async function () {
    waitForReleaseStub.callsFake(async (_app: string, options?: WaitForReleaseOptions): Promise<WaitForReleaseResult> => {
      options?.onPoll?.({onLatest: 1, total: 3, version: 23})
      options?.onPoll?.({onLatest: 3, total: 3, version: 23})
      return {total: 3, version: 23}
    })

    const {stderr} = await runCommand(PsWait, ['--app', APP_NAME])

    expectOutput(stderr, 'Waiting for every dyno to be running v23... 3 / 3, done')
  })

  it('passes flag values through to waitForRelease', async function () {
    waitForReleaseStub.resolves({total: 1, version: 23})

    await runCommand(PsWait, ['--app', APP_NAME, '--type=worker', '--wait-interval=15'])

    const [app, options] = waitForReleaseStub.firstCall.args as [string, WaitForReleaseOptions]
    expect(app).to.equal(APP_NAME)
    expect(options.type).to.equal('worker')
    expect(options.withRun).to.equal(undefined)
    expect(options.delayMs).to.equal(15_000)
  })

  it('passes withRun through with the --with-run flag', async function () {
    waitForReleaseStub.resolves({total: 1, version: 23})

    await runCommand(PsWait, ['--app', APP_NAME, '--with-run'])

    const [, options] = waitForReleaseStub.firstCall.args as [string, WaitForReleaseOptions]
    expect(options.withRun).to.equal(true)
  })
})
