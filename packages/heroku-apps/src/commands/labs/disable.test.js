// @flow

import LabsDisable from './disable'
import nock from 'nock'

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
