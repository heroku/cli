'use strict'
/* globals describe it */

const expect = require('unexpected')
let clients = require('../lib/clients')

describe('clients', () => {
  describe('secure URLs', () => {
    [
      {uri: 'https://heroku.com'},
      {uri: 'http://localhost'},
      {uri: 'http://foo.local'},
      {uri: 'http://10.0.0.1'},
      {uri: 'http://192.168.0.1'}
    ].forEach(test => {
      it(test.uri, () => {
        clients.validateURL(test.uri)
      })
    })

    it('fails when insecure', () => {
      expect(() => clients.validateURL('http://heroku.com'), 'to error', 'Unsupported callback URL. Clients have to use HTTPS.')
    })

    it('fails when invalid', () => {
      expect(() => clients.validateURL('foo'), 'to error', 'Invalid URL')
    })
  })
})
