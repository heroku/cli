import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('webhooks:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('removes the specified app webhook', async function () {
    api
      .delete('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {})

    const {stderr, stdout} = await runCommand(['webhooks:remove', '--app', 'example-app', '99999999-9999-9999-9999-999999999999'])

    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.include('Removing webhook 99999999-9999-9999-9999-999999999999 from')
    expect(unwrap(stderr)).to.include('example-app...')
    expect(unwrap(stderr)).to.include('done')
  })

  it('removes the specified pipeline webhook', async function () {
    api
      .delete('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999')
      .reply(200, {})

    const {stderr, stdout} = await runCommand(['webhooks:remove', '--pipeline', 'example-pipeline', '99999999-9999-9999-9999-999999999999'])

    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.include('Removing webhook 99999999-9999-9999-9999-999999999999 from')
    expect(unwrap(stderr)).to.include('example-pipeline...')
    expect(unwrap(stderr)).to.include('done')
  })
})
