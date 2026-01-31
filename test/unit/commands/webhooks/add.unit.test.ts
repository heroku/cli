import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('webhooks:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('adds a specific app webhook', async function () {
    api
      .post('/apps/example-app/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {})

    const {stderr, stdout} = await runCommand([
      'webhooks:add',
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
    ])

    expect(stdout.trim()).to.equal('')
    expect(unwrap(stderr)).to.include('Adding webhook to ⬢ example-app... done')
  })

  it('adds a specific pipeline webhook', async function () {
    api
      .post('/pipelines/example-pipeline/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        secret: '1234',
        url: 'http://foobar.com',
      })
      .reply(200, {})

    const {stderr, stdout} = await runCommand([
      'webhooks:add',
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
    ])

    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.include('Adding webhook to example-pipeline...')
    expect(unwrap(stderr)).to.include('done')
  })

  it('adds a specific pipeline webhook with secret in header', async function () {
    api
      .post('/pipelines/example-pipeline/webhooks', {
        include: ['foo', 'bar'],
        level: 'notify',
        url: 'http://foobar.com',
      })
      .reply(200, {}, {'heroku-webhook-secret': '1234'})

    const {stderr, stdout} = await runCommand([
      'webhooks:add',
      '--pipeline',
      'example-pipeline',
      '--include',
      'foo,bar',
      '--level',
      'notify',
      '--url',
      'http://foobar.com',
    ])

    expect(stdout).to.contain('=== Webhooks Signing Secret')
    expect(stdout).to.contain('1234')
    expect(unwrap(stderr)).to.contain('Adding webhook to example-pipeline... done')
  })
})
