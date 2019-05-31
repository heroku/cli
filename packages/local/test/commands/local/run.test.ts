/// <reference types="../../../typings/foreman/lib/procfile" />

import {expect, test} from '@oclif/test'

import * as foreman from '../../../src/fork-foreman'

// all foreman `run` commands should be passed to foreman with
// `run`, then `--` which separates foreman args from run args.
// fork(['run', '--', 'echo', 'hello'])
// is the same as passing foreman:
// foreman run -- echo hello
const foremanRunWithArgv = (...args: string[]) => ['run', '--', ...args]

describe('local:run', () => {
  describe('when no arguments are given', function () {
    test
      .stdout()
      .command(['local:run'])
      .catch(/Usage: heroku local:run \[COMMAND\]/)
      .it('errors with proper usage suggestion')
  })

  describe('when arguments are given', function () {
    test
      .stdout()
      .stub(foreman, 'fork', (argv: string[]) => {
        expect(argv).is.eql(['run', '--', 'echo', 'hello'])
      })
      .command(['local:run', 'echo', 'hello'])
      .it('they are passed to foreman after the -- argument seperator')
  })
})
