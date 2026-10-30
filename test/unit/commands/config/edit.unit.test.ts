import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'

import Cmd, {stringToConfig} from '../../../../src/commands/config/edit.js'
import {EditorFactory} from '../../../../src/lib/config/util.js'

describe('config:edit', function () {
  let updated: Record<string, unknown> | string
  let editedConfig = ''
  let createEditorStub: SinonStub
  let editorEditStub: SinonStub
  let confirmStub: SinonStub
  let api: nock.Scope
  let unmatchedRequests: unknown[]
  let noMatchListener: (request: unknown) => void

  beforeEach(function () {
    unmatchedRequests = []
    noMatchListener = request => unmatchedRequests.push(request)
    nock.emitter.on('no match', noMatchListener)
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    try {
      try {
        api.done()
      } finally {
        expect(unmatchedRequests, 'unexpected Nock requests').to.be.empty
      }
    } finally {
      nock.emitter.removeListener('no match', noMatchListener)
      nock.cleanAll()
    }
  })

  describe('stringToConfig', function () {
    it('handles config vars with empty string values', function () {
      expect(stringToConfig("foo=''")).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=""')).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=')).to.deep.equal({foo: ''})
    })
  })

  describe('blank config vars', function () {
    beforeEach(function () {
      editorEditStub = stub().callsFake(function () {
        return Promise.resolve(editedConfig)
      })
      createEditorStub = stub(EditorFactory, 'createEditor').callsFake(() => ({
        edit: editorEditStub,
      }) as any)
      confirmStub = stub(hux, 'confirm').returns(Promise.resolve(true) as any)
    })

    afterEach(function () {
      restore()
    })

    describe('editor failures', function () {
      it('returns the editor error without updating the full config', async function () {
        const editorError = new Error('editor rejected')
        editorEditStub.rejects(editorError)

        api
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1'})

        const {error} = await runCommand(Cmd, ['--app=myapp'])

        expect(error).to.equal(editorError)
        expect(confirmStub.notCalled).to.be.true
        expect(api.isDone()).to.be.true
      })

      it('returns the editor error without updating a single key', async function () {
        const editorError = new Error('editor rejected')
        editorEditStub.rejects(editorError)

        api
          .get('/apps/myapp/config-vars')
          .reply(200, {FIRST: '1'})

        const {error} = await runCommand(Cmd, ['--app=myapp', 'FIRST'])

        expect(error).to.equal(editorError)
        expect(confirmStub.notCalled).to.be.true
        expect(api.isDone()).to.be.true
      })
    })

    describe('deleting config var', function () {
      it('nulls out vars to delete', async function () {
        editedConfig = '\n'

        api
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

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith("NOT_BLANK='not blank'", {
          postfix: '.sh',
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(updated).to.deep.equal({NOT_BLANK: null})
      })
    })

    describe('setting config var to blank', function () {
      it('updates the values with blanks', async function () {
        editedConfig = "BLANK=\nNOT_BLANK=''\n"

        api
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .get('/apps/myapp/config-vars')
          .reply(200, {NOT_BLANK: 'not blank'})
          .patch('/apps/myapp/config-vars')
          .reply(function (_uri, requestBody) {
            updated = requestBody as Record<string, unknown>
            return [200, {BLANK: '', NOT_BLANK: 'not blank'}]
          })

        await runCommand(Cmd, ['--app=myapp'])

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith("NOT_BLANK='not blank'", {
          postfix: '.sh',
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(updated).to.deep.equal({BLANK: '', NOT_BLANK: ''})
      })
    })

    describe('setting specific var', function () {
      it('updates the values with blanks', async function () {
        editedConfig = 'a'

        api
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

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith('1', {
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(updated).to.deep.equal({FIRST: 'a', SECOND: '2'})
      })
    })
  })
})
