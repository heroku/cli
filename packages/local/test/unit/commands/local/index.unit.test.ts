import {expect, test} from '@oclif/test'

import * as foreman from '../../../../src/fork-foreman'

// eslint-disable-next-line node/no-missing-require
const procfile = require('../../../src/load-foreman-procfile')

const loadProcMock = () => ({
  web: './web-command',
  other: './other-command',
})

describe('local', () => {
  describe('with the local:start alias', function () {
    test
      .stub(procfile, 'loadProc', loadProcMock)
      .stub(foreman, 'fork', function () {
      // eslint-disable-next-line prefer-rest-params
        const argv = arguments[0]
        expect(argv).is.eql(['start', 'web,other'])
      })
      .command(['local:start'])
      .it('can call foreman start via the local:start alias')
  })

  describe('without arguments', function () {
    describe('without flags', function () {
      test
        .stub(procfile, 'loadProc', function () {
        // eslint-disable-next-line prefer-rest-params
          expect(arguments[0]).is.equal('Procfile', 'it defaults to loading `Procfile`')

          return {
            web: './web-command',
            other: './other-command',
          }
        })
        .stub(foreman, 'fork', function () {
        // eslint-disable-next-line prefer-rest-params
          expect(arguments[0]).is.eql(['start', 'web,other'])
        })
        .command(['local'])
        .it('can call foreman start with no arguments')
    })

    describe('with a --procfile flag', function () {
      test
        .stub(procfile, 'loadProc', function () {
        // eslint-disable-next-line prefer-rest-params
          expect(arguments[0]).is.equal('Procfile.other')

          return {
            release: './release',
            web: './web-command',
            background: './background',
          }
        })
        .stub(foreman, 'fork', function () {
        // eslint-disable-next-line prefer-rest-params
          const argv = arguments[0]
          expect(argv).is.eql(['start', '--procfile', 'Procfile.other', 'web,background'])
          expect(argv).to.not.include('release', 'the release process is not included')
        })
        .command(['local', '--procfile', 'Procfile.other'])
        .it('can call foreman start with procfile arguments and procfile non-release processes')
    })

    describe('with --procfile, --env, --port flags together', function () {
      test
        .stub(procfile, 'loadProc', loadProcMock)
        .stub(foreman, 'fork', function () {
        // eslint-disable-next-line prefer-rest-params
          const argv = arguments[0]
          expect(argv).is.eql([
            'start',
            '--procfile',
            'Procfile.other',
            '--env',
            'DEBUG=true',
            '--port',
            '4600',
            'web,other',
          ])
        })
        .command(['local', '--port', '4600', '--env', 'DEBUG=true', '--procfile', 'Procfile.other'])
        .it('can call foreman start')
    })
  })

  describe('with arguments', function () {
    describe('without flags', function () {
      test
        .stub(procfile, 'loadProc', function () {
        // eslint-disable-next-line prefer-rest-params
          const [procArg] = arguments
          expect(procArg).is.equal('Procfile', 'it defaults to loading `Procfile`')

          return {
            web: './web-command',
            other: './other-command',
          }
        })
        .stub(foreman, 'fork', function () {
        // eslint-disable-next-line prefer-rest-params
          const argv = arguments[0]
          expect(argv).is.eql(['start', 'web,other'])
        })
        .command(['local', 'web,other'])
        .it('can call foreman start with only arguments')
    })

    describe('with --port, --env and --procfile flags', function () {
      test
        .stub(procfile, 'loadProc', loadProcMock)
        .stub(foreman, 'fork', function () {
        // eslint-disable-next-line prefer-rest-params
          const argv = arguments[0]
          expect(argv).is.eql([
            'start',
            '--procfile',
            'Procfile.other',
            '--env',
            'DEBUG=true',
            '--port',
            '4600',
            'web,other',
          ])
        })
        .command(['local', '--port', '4600', '--env', 'DEBUG=true', '--procfile', 'Procfile.other'])
        .it('can call foreman start with arguments and --port, --env and --procfile flags')
    })

    describe('with too many arguments', function () {
      test
        .command(['local', 'Procfile.other', 'extra-argument'])
        .catch(error => expect(error.message).to.contain('Unexpected argument: extra-argument'))
        .it('will display an error')
    })
  })

  describe('with deprecated flags', function () {
    test
      .command(['local', '--restart'])
      .catch(error => {
        expect(error.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('errors with deprecated restart flag message')

    test
      .command(['local', '--concurrency', 'web=2'])
      .catch(error => {
        expect(error.message).to.equal('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('errors with deprecated concurrency flag')
  })
})
