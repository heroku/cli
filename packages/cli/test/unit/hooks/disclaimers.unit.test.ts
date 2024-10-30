import {Config, ux} from '@oclif/core'
import {CLIError} from '@oclif/core/lib/errors'
import {expect} from 'chai'
import {join} from 'path'
import * as sinon from 'sinon'
import {stderr} from 'stdout-stderr'

describe('disclaimers ‘plugins:preinstall’ hook', function () {
  let config: Config
  let sandbox: sinon.SinonSandbox

  before(async function () {
    config = await Config.load({root: join(__dirname, '../../..')})
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  context('when installing from a Github repository', function () {
    it('doesn’t show the disclaimer', async function () {
      stderr.start()
      config.runHook('plugins:preinstall', {
        plugin: {
          url: 'https://github.com/heroku/heroku-api-plugin',
          type: 'repo',
        },
      })
      stderr.stop()

      expect(stderr.output).not.to.include('This pilot feature is a Beta Service.')
    })
  })

  context('when installing a plugin different from ‘@heroku/plugin-ai’ or ‘@heroku-cli/plugin-ai’', function () {
    it('doesn’t show the disclaimer', async function () {
      stderr.start()
      config.runHook('plugins:preinstall', {
        plugin: {
          name: '@heroku-cli/plugin-events',
          tag: 'latest',
          type: 'npm',
        },
      })
      stderr.stop()

      expect(stderr.output).not.to.include('This pilot feature is a Beta Service.')
    })
  })

  context('when installing the ‘@heroku/plugin-ai’ plugin', function () {
    it('shows the disclaimer and prompts the user', async function () {
      const promptStub = sandbox.stub(ux, 'prompt').onFirstCall().resolves('y')

      stderr.start()
      await config.runHook('plugins:preinstall', {
        plugin: {
          name: '@heroku/plugin-ai',
          tag: 'latest',
          type: 'npm',
        },
      })
      stderr.stop()

      expect(stderr.output).to.include('This pilot feature is a Beta Service.')
      expect(promptStub.calledOnce).to.be.true
    })

    it('cancels installation if customer doesn’t accepts the prompt', async function () {
      sandbox.stub(ux, 'prompt').onFirstCall().resolves('n')

      stderr.start()
      try {
        await config.runHook('plugins:preinstall', {
          plugin: {
            name: '@heroku/plugin-ai',
            tag: 'latest',
            type: 'npm',
          },
        })
      } catch (error: unknown) {
        stderr.stop()
        const {message, oclif} = error as CLIError
        expect(message).to.equal('Canceled')
        expect(oclif.exit).to.equal(1)
      }
    })
  })

  context('when installing the ‘@heroku-cli/plugin-ai’ plugin', function () {
    it('shows the disclaimer and prompts the user', async function () {
      const promptStub = sandbox.stub(ux, 'prompt').onFirstCall().resolves('y')

      stderr.start()
      await config.runHook('plugins:preinstall', {
        plugin: {
          name: '@heroku-cli/plugin-ai',
          tag: 'latest',
          type: 'npm',
        },
      })
      stderr.stop()

      expect(stderr.output).to.include('This pilot feature is a Beta Service.')
      expect(promptStub.calledOnce).to.be.true
    })

    it('cancels installation if customer doesn’t accepts the prompt', async function () {
      sandbox.stub(ux, 'prompt').onFirstCall().resolves('n')

      stderr.start()
      try {
        await config.runHook('plugins:preinstall', {
          plugin: {
            name: '@heroku-cli/plugin-ai',
            tag: 'latest',
            type: 'npm',
          },
        })
      } catch (error: unknown) {
        stderr.stop()
        const {message, oclif} = error as CLIError
        expect(message).to.equal('Canceled')
        expect(oclif.exit).to.equal(1)
      }
    })
  })
})
