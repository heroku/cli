import {Config} from '@oclif/core'
import {expect} from 'chai'
import {join} from 'path'
import {stderr} from 'stdout-stderr'

describe('disclaimers ‘plugins:preinstall’ hook', function () {
  let config: Config

  before(async function () {
    config = await Config.load({root: join(__dirname, '../../..')})
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
    it('shows the disclaimer', async function () {
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
    })
  })

  context('when installing the ‘@heroku-cli/plugin-ai’ plugin', function () {
    it('shows the disclaimer', async function () {
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
    })
  })
})
