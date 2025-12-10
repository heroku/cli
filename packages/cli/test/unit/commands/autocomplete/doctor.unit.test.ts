import {Config} from '@oclif/core'
import {expect} from 'chai'
import * as path from 'path'
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

  before(async function () {
    await config.load()
    cmd = new Doctor([], config)
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
})

