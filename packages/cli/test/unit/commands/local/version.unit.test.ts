import {runCommand} from '@oclif/test'
import {expect} from 'chai'

import * as foreman from '../../../../src/lib/local/fork-foreman.js'
import * as fs from 'fs'
import * as path from 'path'
import {fileURLToPath} from 'url'
import sinon from 'sinon'

let existsSyncSpy: any
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const extensionRoot = path.join(__dirname, '..', '..', '..', '..', 'src', 'lib', 'local')
const jsExtensionPath = path.join(extensionRoot, 'run-foreman.js')

/*
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

*/
