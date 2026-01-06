import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand.js'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import Cmd, {stringToConfig} from '../../../../src/commands/config/edit.js'
import {EditorFactory} from '../../../../src/lib/config/util.js'

let updated: string | Record<string, unknown>
let editedConfig = ''
let createEditorStub: sinon.SinonStub

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
      createEditorStub = sinon.stub(EditorFactory, 'createEditor').callsFake(() => ({
        edit: () => Promise.resolve(editedConfig),
      }) as any)
      sinon.stub(hux, 'confirm').returns(Promise.resolve(true) as any)
    })

    afterEach(function () {
      sinon.restore()
      nock.cleanAll()
    })

    describe('deleting config var', function () {
      it('nulls out vars to delete', async () => {
        editedConfig = '\n'

        nock('https://api.heroku.com')
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody as Record<string, unknown>
            return [200, {}]
          })

        await runCommand(Cmd, ['--app=myapp'])

        expect(updated).to.deep.equal({NOT_BLANK: null})
      })
    })

    describe('setting config var to blank', function () {
      it('updates the values with blanks', async () => {
        editedConfig = "BLANK=\nNOT_BLANK=''\n"

        nock('https://api.heroku.com')
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody as Record<string, unknown>
            return [200, {NOT_BLANK: 'not blank', BLANK: ''}]
          })

        await runCommand(Cmd, ['--app=myapp'])

        expect(updated).to.deep.equal({BLANK: '', NOT_BLANK: ''})
      })
    })

    describe('setting specific var', function () {
      it('updates the values with blanks', async () => {
        editedConfig = 'a'

        nock('https://api.heroku.com')
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1', SECOND: '2'})
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1', SECOND: '2'})
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody as Record<string, unknown>
            return [200, {DOES_NOT: 'matter'}]
          })

        await runCommand(Cmd, ['--app=myapp', 'FIRST'])

        expect(updated).to.deep.equal({FIRST: 'a', SECOND: '2'})
      })
    })
  })
})
