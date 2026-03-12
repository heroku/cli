import {expect} from 'chai'

import {validateURL} from '../../../../src/lib/clients/clients.js'

describe('validateURL', function () {
  describe('secure URLs', function () {
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
    ].forEach(({uri}) => {
      it(`passes when secure (${uri})`, function () {
        expect(validateURL(uri))
      })
    })

    describe('insecure URLs', function () {
      [
        {uri: 'http://heroku.com'},
        {uri: 'http://10.foo.com'},
        {uri: 'http://127.foo.com'},
        {uri: 'http://192.foo.com'},
      ].forEach(({uri}) => {
        it(`fails when insecure (${uri})`, function () {
          try {
            validateURL(uri)
            expect.fail('Expected validateURL to throw an error')
          } catch (error: any) {
            expect(error.message).to.equal(
              'Unsupported callback URL. Clients have to use HTTPS for non-local addresses.',
            )
          }
        })
      })
    })

    describe('invalid URLs', function () {
      it('fails when invalid', function () {
        try {
          validateURL('foo')
          expect.fail('Expected validateURL to throw an error')
        } catch (error: any) {
          expect(error.message).to.contain('Invalid URL')
        }
      })
    })
  })
})
