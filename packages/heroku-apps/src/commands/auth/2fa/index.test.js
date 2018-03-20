// @flow

import nock from 'nock'
import Index from '.'

let api

beforeEach(() => {
  api = nock('https://api.heroku.com')
})

afterEach(() => {
  api.done()
})

it('shows 2fa is enabled', async () => {
  api
    .get('/account')
    .reply(200, {two_factor_authentication: true})

  let cmd = await Index.mock()
  expect(cmd.stdout).toEqual('Two-factor authentication is enabled\n')
})

it('shows 2fa is disabled', async () => {
  api
    .get('/account')
    .reply(200, {two_factor_authentication: false})

  let cmd = await Index.mock()
  expect(cmd.stdout).toEqual('Two-factor authentication is not enabled\n')
})
