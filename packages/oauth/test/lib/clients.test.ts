import {expect, test} from '@oclif/test'

import {validateURL} from '../../src/lib/clients'

describe('validateURL', () => {
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
    ].forEach(({uri}) => {
      test
      .it(`passes when secure (${uri})`, () => {
        expect(validateURL(uri))
      })
    })

    describe('insecure URLs', () => {
      [
        {uri: 'http://heroku.com'},
        {uri: 'http://10.foo.com'},
        {uri: 'http://127.foo.com'},
        {uri: 'http://192.foo.com'},
      ].forEach(({uri}) => {
        test
        .do(() => validateURL(uri))
        .catch(error => expect(error.message).to.equal(
          'Unsupported callback URL. Clients have to use HTTPS for non-local addresses.',
        ))
        .it(`fails when insecure (${uri})`)
      })
    })

    describe('invalid URLs', () => {
      test
      .do(() => validateURL('foo'))
      .catch(error => expect(error.message).to.contain('Invalid URL'))
      .it('fails when invalid')
    })
  })
})
