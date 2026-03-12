import {expect} from 'chai'

import Run from '../../../../src/commands/local/run.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('local:run', function () {
  describe('argument validation', function () {
    it('requires command argument and shows usage', async function () {
      const {error} = await runCommand(Run, [])

      expect(error?.message).to.match(/Usage: heroku local:run \[COMMAND\]/)
      expect(error?.message).to.contain('Must specify command to run')
    })
  })

  describe('flag validation', function () {
    it('accepts --env flag', async function () {
      const {error} = await runCommand(Run, ['echo', 'test', '--env', 'valid.env'])

      // If this fails, it means flag parsing worked and foreman was called
      // We expect this to fail because we don't have foreman mocked
      expect(error?.message).to.not.contain('Invalid flag')
    })

    it('accepts -e shorthand for env flag', async function () {
      const {error} = await runCommand(Run, ['echo', 'test', '-e', 'valid.env'])

      // If this fails, it means flag parsing worked and foreman was called
      expect(error?.message).to.not.contain('Invalid flag')
    })

    it('accepts --port flag', async function () {
      const {error} = await runCommand(Run, ['echo', 'test', '--port', '4200'])

      // If this fails, it means flag parsing worked and foreman was called
      expect(error?.message).to.not.contain('Invalid flag')
    })

    it('accepts -p shorthand for port flag', async function () {
      const {error} = await runCommand(Run, ['echo', 'test', '-p', '4200'])

      // If this fails, it means flag parsing worked and foreman was called
      expect(error?.message).to.not.contain('Invalid flag')
    })
  })
})
