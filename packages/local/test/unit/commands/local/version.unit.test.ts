import {expect, test} from '@oclif/test'

import * as foreman from '../../../../src/fork-foreman'
import * as fs from 'fs'
const sinon = require('sinon')

let existsSyncSpy: any
let existsSyncStub: any

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
      const withJsExtension = existsSyncSpy.getCall(11).args[0]
      const withTsExtension = existsSyncSpy.getCall(12).args[0]
      expect(withJsExtension).to.include('local/src/run-foreman.js')
      expect(withTsExtension).to.include('local/src/run-foreman.ts')
    })

  // test
  //   // .stderr()
  //   // .do(() => {
  //   //   existsSyncStub = sinon.stub(fs, 'existsSync').returns(false)
  //   // })
  //   .stub(fs, 'existsSync', () => false)
  //   .command(['local:version'])
  //   .catch(error => {
  //     expect(error.message).to.equal('Path to file not found')
  //   })
  //   .it('is errors with no file path found')

  // test
  //   .do(() => {
  //     existsSyncStub = sinon.stub(fs, 'existsSync')
  //   })
  //   .command(['local:version'])
  //   .it('selects correct extensions', () => {
  //     // existsSync is called multiple times in the stack before
  //     // the expected arguments are passed. This checks that the
  //     // correct arguments are passed

  //     existsSyncStub.onCall(11).return(false)
  //     existsSyncStub.onCall(12).return(false)
  //   })

  test
    .command(['local:version', 'extra'])
    .catch(error => expect(error.message).to.equal('Unexpected argument: extra\nSee more help with --help'))
    .it('is throws an error when extra arguments are passed in')
})
