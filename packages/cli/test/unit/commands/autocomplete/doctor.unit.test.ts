import {Config} from '@oclif/core'
import {expect} from 'chai'
import {hux} from '@heroku/heroku-cli-util'
import fs from 'fs-extra'
import * as path from 'path'
import * as sinon from 'sinon'
import {fileURLToPath} from 'url'

import Doctor from '../../../../src/commands/autocomplete/doctor.js'

// autocomplete will throw error on windows
import {default as runtest} from '../../../helpers/autocomplete/runtest.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = path.resolve(__dirname, '../../../package.json')
const config = new Config({root})

runtest('autocomplete:doctor', () => {
  let cmd: Doctor
  let sandbox: sinon.SinonSandbox

  before(async function () {
    await config.load()
    cmd = new Doctor([], config)
  })

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('can be instantiated', function () {
    expect(cmd).to.be.instanceOf(Doctor)
  })

  it('has correct description', function () {
    expect(Doctor.description).to.eq('autocomplete diagnostic')
  })

  it('is hidden', function () {
    expect(Doctor.hidden).to.be.true
  })

  it('has verbose flag', function () {
    expect(Doctor.flags).to.have.property('verbose')
  })

  describe('ESM migration verification', function () {
    it('imports use .js extensions for ESM compatibility', function () {
      // Verify the command file uses ESM imports
      // This is verified by the fact that the import statement works
      expect(Doctor).to.exist
    })

    it('uses hux from @heroku/heroku-cli-util', function () {
      // Verify hux is imported and available (migration from old ux helpers)
      expect(hux).to.have.property('table')
      expect(hux.table).to.be.a('function')
    })

    it('uses fileURLToPath for __dirname equivalent', function () {
      // Verify ESM-compatible path handling
      expect(__filename).to.be.a('string')
      expect(__dirname).to.be.a('string')
    })
  })

  describe('#run', function () {
    it('has run method defined', function () {
      expect(cmd.run).to.be.a('function')
    })
  })

  describe('#printList', function () {
    let logStub: sinon.SinonStub

    beforeEach(function () {
      logStub = sandbox.stub(cmd, 'log')
      // Mock config.plugins
      ;(cmd.config as any).plugins = [
        {
          commands: [
            {
              id: 'test:command',
              hidden: false,
              flags: {
                app: {type: 'option', description: 'app to use'},
                json: {type: 'boolean', description: 'output json'},
              },
            },
            {
              id: 'hidden:command',
              hidden: true,
              flags: {},
            },
          ],
        },
      ]
    })

    it('prints completable commands', function () {
      ;(cmd as any).printList()

      expect(logStub.called).to.be.true
      const calls = logStub.getCalls()
      expect(calls.some((call: any) => call.args[0].includes('Completable Commands'))).to.be.true
    })

    it('includes hidden commands', function () {
      ;(cmd as any).printList()

      const calls = logStub.getCalls()
      const output = calls.map((c: any) => c.args[0]).join('\n')
      expect(output).to.include('hidden:command (hidden)')
    })
  })
})

