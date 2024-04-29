import {expect, test} from '@oclif/test'

import * as foreman from '../../../../src/lib/local/fork-foreman'
import * as fs from 'fs'
import * as path from 'path'

const sinon = require('sinon')
let existsSyncSpy: any
const extensionRoot = path.join(__dirname, '..', '..', '..', '..', 'src', 'lib', 'local')
const jsExtensionPath = path.join(extensionRoot, 'run-foreman.js')

describe('local:version', function () {
  test
    .stub(foreman, 'fork', function () {
    // eslint-disable-next-line prefer-rest-params
      const argv = arguments[0]
      expect(argv).is.eql(['--version'])
    })
    .command(['local:version'])
    .it('is passes the --version flag to foreman')

  test
    .do(() => {
      existsSyncSpy = sinon.spy(fs, 'existsSync')
    })
    .command(['local:version'])
    .it('selects correct extensions', () => {
      expect(existsSyncSpy.calledWith(jsExtensionPath)).to.be.true
    })

  test
    .command(['local:version', 'extra'])
    .catch(error => expect(error.message).to.equal('Unexpected argument: extra\nSee more help with --help'))
    .it('is throws an error when extra arguments are passed in')
})
