const { expect } = require('chai')
const nock = require('nock')
const stream = require('stream')

const streamer = require('../lib/streamer')

function MockOut () {
  // Inherit properties
  stream.Writable.call(this)

  this.data = []
}
// Inherit prototype
MockOut.prototype = Object.create(stream.Writable.prototype)
MockOut.prototype.constructor = stream.Writable

MockOut.prototype._write = function (d) {
  this.data.push(d)
}

describe('streaming', () => {
  it('streams data', () => {
    const ws = new MockOut()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .reply(200, 'My data')

    return streamer('https://streamer.test/streams/data.log', ws)
      .then(() => expect(ws.data.join('')).to.equal('My data'))
      .then(() => api.done())
  })

  it('retries a missing stream', () => {
    const ws = new MockOut()
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
  }).timeout(5 * 1000 * 1.2)

  it('errors on too many retries', async () => {
    const ws = new MockOut()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .times(10)
      .reply(404, '')

    await expect(streamer('https://streamer.test/streams/data.log', ws)).to.be.rejected
    await api.done()
  }).timeout(10 * 1000 * 1.2)

  it('does not retry on non-404 errors', async () => {
    const ws = new MockOut()
    const api = nock('https://streamer.test:443')
      .get('/streams/data.log')
      .reply(504, '')

    await expect(streamer('https://streamer.test/streams/data.log', ws)).to.be.rejected
    await api.done()
  })
})
