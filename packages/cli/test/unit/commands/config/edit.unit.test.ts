import {ux} from '@oclif/core'
import * as sinon from 'sinon'

import {stringToConfig} from '../../../../src/commands/config/edit'
import {Editor} from '../../../../src/lib/config/util'
import {expect, test} from '@oclif/test'

let sandbox: any
let updated: string | Record<string, unknown>
let editedConfig = ''

describe('config:edit', function () {
  describe('stringToConfig', function () {
    it('handles config vars with empty string values', function () {
      expect(stringToConfig("foo=''")).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=""')).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=')).to.deep.equal({foo: ''})
    })
  })

  describe('blank config vars', function () {
    beforeEach(function () {
      sandbox = sinon.createSandbox()
      sandbox.stub(Editor.prototype, 'edit')
        .callsFake(() => {
          return Promise.resolve(editedConfig)
        })
      sandbox.stub(ux, 'confirm')
        .value(() => {
          return Promise.resolve(true)
        })
      sandbox.stub(ux, 'log')
        .value(() => {
          return Promise.resolve()
        })
      sandbox.stub(ux.action, 'start')
        .value(() => {})
      sandbox.stub(ux.action, 'stop')
        .value(() => {})
    })

    afterEach(function () {
      sandbox.restore()
    })

    describe('deleting config var', function () {
      beforeEach(function () {
        editedConfig = '\n'
      })

      test
        .nock('https://api.heroku.com', api => api
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'}),
        )
        .nock('https://api.heroku.com', api => api
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody
            return [200, {}]
          }),
        )
        .command(['config:edit', '--app=myapp'])
        .it('nulls out vars to delete', () => {
          expect(updated).to.deep.equal({NOT_BLANK: null})
        })
    })

    describe('setting config var to blank', function () {
      beforeEach(function () {
        editedConfig = "BLANK=\nNOT_BLANK=''\n"
      })

      test
        .nock('https://api.heroku.com', api => api
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'}),
        )
        .nock('https://api.heroku.com', api => api
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody
            return [200, {NOT_BLANK: 'not blank', BLANK: ''}]
          }),
        )
        .command(['config:edit', '--app=myapp'])
        .it('updates the values with blanks', () => {
          expect(updated).to.deep.equal({BLANK: '', NOT_BLANK: ''})
        })
    })

    describe('setting specific var', function () {
      beforeEach(function () {
        editedConfig = 'a'
      })

      test
        .nock('https://api.heroku.com', api => api
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1', SECOND: '2'})
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1', SECOND: '2'}),
        )
        .nock('https://api.heroku.com', api => api
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody
            return [200, {DOES_NOT: 'matter'}]
          }),
        )
        .command(['config:edit', '--app=myapp', 'FIRST'])
        .it('updates the values with blanks', () => {
          expect(updated).to.deep.equal({FIRST: 'a', SECOND: '2'})
        })
    })
  })
})
