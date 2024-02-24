/* eslint-env mocha */
import {expect} from 'chai'
import * as nock from 'nock'
import * as stream from 'stream'
const lolex = require('lolex')

import {streamer} from '../../../../src/lib/container/streamer'

function MockOut(this: any) {
  // Inherit properties
  stream.Writable.call(this)

  this.data = []
}

// Inherit prototype
MockOut.prototype = Object.create(stream.Writable.prototype)
MockOut.prototype.constructor = stream.Writable

MockOut.prototype._write = function (d: any) {
  this.data.push(d)
}

describe('streaming', () => {
  let clock: ReturnType<typeof lolex.install>

  beforeEach(function () {
    clock = lolex.install()
    clock.setTimeout = function (fn: any) {
      fn()
    }
  })

  afterEach(function () {
    clock.uninstall()
  })

  it('streams data', () => {
    const ws = new (MockOut as any)()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .reply(200, 'My data')

    return streamer('https://streamer.test/streams/data.log', ws)
      .then(() => expect(ws.data.join('')).to.equal('My data'))
      .then(() => api.done())
  })

  it('retries a missing stream', () => {
    const ws = new (MockOut as any)()
    let attempts = 0

    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .times(5)
      .reply(function () {
        attempts++

        if (attempts < 5) {
          return [404, '']
        }

        return [200, 'My retried data']
      })

    return streamer('https://streamer.test/streams/data.log', ws)
      .then(() => expect(ws.data.join('')).to.equal('My retried data'))
      .then(() => api.done())
  })

  it('errors on too many retries', async () => {
    const ws = new (MockOut as any)()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .times(30)
      .reply(404, '')

    await expect(streamer('https://streamer.test/streams/data.log', ws)).to.be.rejected
    api.done()
  })

  it('does not retry on non-404 errors', async () => {
    const ws = new (MockOut as any)()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .reply(504, '')

    await expect(streamer('https://streamer.test/streams/data.log', ws)).to.be.rejected
    api.done()
  })
})
