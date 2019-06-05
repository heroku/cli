/// <reference types="../../../typings/foreman/lib/procfile" />

import { expect, test } from '@oclif/test'
import * as procfile from 'foreman/lib/procfile'

import * as foreman from '../../../src/fork-foreman'

describe('local', () => {
  let loadProcMock = () => ({
    web: './web-command',
    other: './other-command'
  })

  describe('with the local:start alias', function () {
    test
      .stdout()
      .stub(procfile, 'loadProc', loadProcMock)
      .stub(foreman, 'fork', (argv: string[]) => {
        expect(argv).is.eql(['start', 'web,other'])
      })
      .command(['local:start'])
      .it('can call foreman start via the local:start alias')
  })

  describe('without arguments', function () {
    describe('without flags', function () {
      test
        .stdout()
        .stub(procfile, 'loadProc', function(procfile: any) {
          expect(procfile).is.equal('Procfile', 'it defaults to loading `Procfile`')

          return {
            web: './web-command',
            other: './other-command'
          }
        })
        .stub(foreman, 'fork', (argv: string[]) => {
          expect(argv).is.eql(['start', 'web,other'])
        })
        .command(['local'])
        .it('can call foreman start with no arguments')
    })

    describe('with a --procfile flag', function () {
      test
        .stdout()
        .stub(procfile, 'loadProc', (procfile: string) => {
          expect(procfile).is.equal('Procfile.other')

          return {
            release: './release',
            web: './web-command',
            background: './background'
          }
        })
        .stub(foreman, 'fork', (argv: string[]) => {
          expect(argv).is.eql(['start', '--procfile', 'Procfile.other', 'web,background'])
          expect(argv).to.not.include('release', 'the release process is not included')
        })
        .command(['local', '--procfile', 'Procfile.other'])
        .it('can call foreman start with procfile arguments and procfile non-release processes')
    })

    describe('with --procfile, --env, --port flags together', function() {
      test
        .stdout()
        .stub(procfile, 'loadProc', loadProcMock)
        .stub(foreman, 'fork', (argv: string[]) => {
          expect(argv).is.eql([
            'start',
            '--procfile',
            'Procfile.other',
            '--env',
            'DEBUG=true',
            '--port',
            '4600',
            'web,other'
          ])
        })
        .command(['local', '--port', '4600', '--env', 'DEBUG=true', '--procfile', 'Procfile.other'])
        .it('can call foreman start')
    })
  })

  describe('with arguments', function () {
    describe('without flags', function () {
      test
        .stdout()
        .stub(procfile, 'loadProc', function(procfile: any) {
          expect(procfile).is.equal('Procfile', 'it defaults to loading `Procfile`')

          return {
            web: './web-command',
            other: './other-command'
          }
        })
        .stub(foreman, 'fork', (argv: string[]) => {
          expect(argv).is.eql(['start', 'web,other'])
        })
        .command(['local', 'web,other'])
        .it('can call foreman start with only arguments')
    })

    describe('with --port, --env and --prcofile flags', function() {
      test
        .stdout()
        .stub(procfile, 'loadProc', loadProcMock)
        .stub(foreman, 'fork', (argv: string[]) => {
          expect(argv).is.eql([
            'start',
            '--procfile',
            'Procfile.other',
            '--env',
            'DEBUG=true',
            '--port',
            '4600',
            'web,other'
          ])
        })
        .command(['local', '--port', '4600', '--env', 'DEBUG=true', '--procfile', 'Procfile.other'])
        .it('can call foreman start')
    })
  })

  describe('with deprecated flags', function() {
    test
      .stdout()
      .command(['local', '--restart'])
      .catch(e => {
        expect(e.message).to.equal('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('errors with deprecated restart flag message')

    test
      .stdout()
      .command(['local', '--concurrency', 'web=2'])
      .catch(e => {
        expect(e.message).to.equal('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')
      })
      .it('errors with deprecated concurrency flag')
  })
})
