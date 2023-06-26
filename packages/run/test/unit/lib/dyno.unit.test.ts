import {expect, test} from '@oclif/test'
import * as Heroku from 'heroku-client'
import Dyno from '../../../src/lib/dyno'

describe('dyno()', () => {
  describe('Runs with minimal opts', () => {
    const opts = {
      // 'exit-code': true,
      // 'no-tty': false,
      app: 'heroku-cli-ci-smoke-test-app',
      // attach: true,
      command: 'bash',
      // env: flags.env,
      heroku: new Heroku(),
      // notify: !flags['no-notify'],
      // size: flags.size,
      // type: flags.type,
    }
    let dyno
    test
      .nock('https://api.heroku.com', api => {
        api.post(`/apps/${opts.app}/dynos`)
          .reply(200,
            {body: {
              name: 'run.1234',
              id: '123',
            }})
      })
      .do(async () => {
        dyno = new Dyno(opts)
        await dyno.start()
      })
      .it('runs does not error')
  })

  describe('Runs with attach', async () => {
    const opts = {
      // 'exit-code': true,
      // 'no-tty': false,
      app: 'heroku-cli-ci-smoke-test-app',
      // attach: true,
      command: 'bash',
      // env: flags.env,
      heroku: new Heroku(),
      // notify: !flags['no-notify'],
      // size: flags.size,
      // type: flags.type,
    }
    let dyno
    test
      .nock('https://api.heroku.com', api => {
        api.post(`/apps/${opts.app}/dynos`)
          .reply(200,
            {body: {
              name: 'run.1234',
              id: '123',
            }})
      })
      .stdout()
      .do(async () => {
        dyno = new Dyno(opts)
        await dyno.start()
      })
      .it('runs without error', context => {
        expect(context.stdout).to.contain(`Running bash on ⬢ ${opts.app}...`)
      })
  })
})

