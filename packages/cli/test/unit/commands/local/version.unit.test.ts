import {expect, test} from '@oclif/test'

import * as foreman from '../../../../src/lib/fork-foreman'
import * as fs from 'fs'
import * as path from 'path'

const sinon = require('sinon')
let existsSyncSpy: any
const jsExtensionPath = path.join('local', 'src', 'run-foreman.js')
const tsExtensionPath = path.join('local', 'src', 'run-foreman.ts')

describe('local:version', () => {
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
      // existsSync is called multiple times in the stack before
      // the expected arguments are passed. This checks that the
      // correct arguments are passed
      const withJsExtension = existsSyncSpy.getCall(31).args[0]
      const withTsExtension = existsSyncSpy.getCall(32).args[0]
      expect(withJsExtension).to.include(jsExtensionPath)
      expect(withTsExtension).to.include(tsExtensionPath)
    })

  test
    .command(['local:version', 'extra'])
    .catch(error => expect(error.message).to.equal('Unexpected argument: extra\nSee more help with --help'))
    .it('is throws an error when extra arguments are passed in')
})
