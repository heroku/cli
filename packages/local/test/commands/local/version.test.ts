/// <reference types="../../../typings/foreman/lib/procfile" />

import {expect, test} from '@oclif/test'

import * as foreman from '../../../src/fork-foreman'

describe('local:version', () => {
  test
    .stdout()
    .stub(foreman, 'fork', (argv: string[]) => {
      expect(argv).is.eql(['--version'])
    })
    .command(['local:version'])
    .it('is passes the --version flag to foreman')

  test
    .stdout()
    .command(['local:version extra'])
    .catch(e => e.message.includes('Error: Unexpected argument: extra'))
    .it('is throws an error when extra arguments are passed in')
})
