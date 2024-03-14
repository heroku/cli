'use strict'

const {expect} = require('chai')
let clients = require('../lib/clients')

describe('clients', () => {
  describe('secure URLs', () => {
    [
      {uri: 'https://heroku.com'},
      {uri: 'https://heroku.com:8080/foo'},
      {uri: 'http://localhost'},
      {uri: 'http://localhost:8080/foo'},
      {uri: 'http://foo.local'},
      {uri: 'http://foo.local/foo'},
      {uri: 'http://10.0.0.1'},
      {uri: 'http://10.0.0.1:8080/foo'},
      {uri: 'http://127.0.0.1'},
      {uri: 'http://127.0.0.1:8080/foo'},
      {uri: 'http://192.168.0.1'},
      {uri: 'http://192.168.0.1:8080/foo'},
    ].forEach(test => {
      it('passes when secure (' + test.uri + ')', () => {
        clients.validateURL(test.uri)
      })
    })
  })

  describe('insecure URLs', () => {
    [
      {uri: 'http://heroku.com'},
      {uri: 'http://10.foo.com'},
      {uri: 'http://127.foo.com'},
      {uri: 'http://192.foo.com'},
      {uri: 'http://192.foo.com'},
      {uri: 'http://example.com'},
    ].forEach(test => {
      it('fails when insecure (' + test.uri + ')', () => {
        try {
          clients.validateURL(test.uri)
        } catch (error) {
          expect(error.message).to.equal('Unsupported callback URL. Clients have to use HTTPS for non-local addresses.')
        }
      })
    })
  })

  it('fails when invalid', () => {
    expect(() => clients.validateURL('foo'), 'to error', 'Invalid URL')
  })
})
