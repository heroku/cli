// @flow

import LabsDisable from './disable'
import nock from 'nock'
const cli = require('heroku-cli-util')

let api
beforeEach(() => {
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
})

test('disables a user lab feature', async () => {
  api
    .get('/account')
    .reply(200, {email: 'jeff@heroku.com'})
    .get('/account/features/feature-a')
    .reply(200, {
      enabled: true,
      name: 'feature-a',
      description: 'a user lab feature',
      doc_url: 'https://devcenter.heroku.com'
    })
    .patch('/account/features/feature-a', {enabled: false})
    .reply(200)
  let {stdout, stderr} = await LabsDisable.mock('feature-a')
  expect(stdout).toEqual('')
  expect(stderr).toEqual('Disabling feature-a for jeff@heroku.com... done\n')
})

test('disables an app feature', async () => {
  api
    .get('/account/features/feature-a').reply(404)
    .get('/apps/myapp/features/feature-a')
    .reply(200, {
      enabled: true,
      name: 'feature-a',
      description: 'a user lab feature',
      doc_url: 'https://devcenter.heroku.com'
    })
    .patch('/apps/myapp/features/feature-a', {enabled: false}).reply(200)
  let {stdout, stderr} = await LabsDisable.mock('feature-a', '--app=myapp')
  expect(stdout).toEqual('')
  expect(stderr).toEqual('Disabling feature-a for myapp... done\n')
})

describe('requires confirmation to disable a secure feature', () => {
  beforeEach(() => {
    api
      .get('/account/features/spaces-strict-tls').reply(404)
      .get('/apps/myapp/features/spaces-strict-tls')
      .reply(200, {
        enabled: true,
        name: 'spaces-strict-tls',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com'
      })
      .patch('/apps/myapp/features/spaces-strict-tls', {enabled: false}).reply(200)
  })

  test('warns and prompts for confirmation', async () => {
    cli.prompt = function () { return Promise.resolve('myapp') }
    let {stdout, stderr} = await LabsDisable.mock(['spaces-strict-tls', '--app=myapp'])
    expect(stdout).toEqual('')
    expect(stderr).toEqual(` ▸    WARNING: Insecure Action
 ▸    You are enabling an older security protocol, TLS 1.0, which some
 ▸    organizations may not deem secure.
 ▸    To proceed, type myapp or re-run this command with --confirm myapp
Disabling spaces-strict-tls for myapp... done
`)
  })

  test('uses confirm flag and does not warn', async () => {
    let {stdout, stderr} = await LabsDisable.mock(['spaces-strict-tls', '--app=myapp', '--confirm=myapp'])
    expect(stdout).toEqual('')
    expect(stderr).toEqual('Disabling spaces-strict-tls for myapp... done\n')
  })
})
