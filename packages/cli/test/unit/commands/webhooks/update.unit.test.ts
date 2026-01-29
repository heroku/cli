import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('webhooks:update', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('updates app webhooks', async function () {
    api
      .patch('/apps/example-app/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {})

    const {stderr, stdout} = await runCommand([
      'webhooks:update',
      '--app',
      'example-app',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.include('Updating webhook 99999999-9999-9999-9999-999999999999 for')
    expect(unwrap(stderr)).to.include('example-app...')
    expect(unwrap(stderr)).to.include('done')
  })

  it('updates pipelines webhooks', async function () {
    api
      .patch('/pipelines/example-pipeline/webhooks/99999999-9999-9999-9999-999999999999', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {})

    const {stderr, stdout} = await runCommand([
      'webhooks:update',
      '--pipeline',
      'example-pipeline',
      '--include',
      'foo,bar',
      '--secret',
      '1234',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
      '99999999-9999-9999-9999-999999999999',
    ])

    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.include('Updating webhook 99999999-9999-9999-9999-999999999999 for')
    expect(unwrap(stderr)).to.include('example-pipeline...')
    expect(unwrap(stderr)).to.include('done')
  })
})
