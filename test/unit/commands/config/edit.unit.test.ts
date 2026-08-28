import {runCommand} from '@heroku-cli/test-utils'
import {hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd, {stringToConfig} from '../../../../src/commands/config/edit.js'
import {EditorFactory} from '../../../../src/lib/config/util.js'

type FakePlatform = {
  configVar: {
    infoForApp: SinonStub
    update: SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    configVar: {
      infoForApp: stub(),
      update: stub(),
    },
  }
}

describe('config:edit', function () {
  let editedConfig = ''
  let createEditorStub: SinonStub
  let editorEditStub: SinonStub
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
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
      stub(hux, 'confirm').returns(Promise.resolve(true) as any)
    })

    afterEach(function () {
      restore()
    })

    describe('deleting config var', function () {
      it('nulls out vars to delete', async function () {
        editedConfig = '\n'

        fakePlatform.configVar.infoForApp.resolves({NOT_BLANK: 'not blank'})
        fakePlatform.configVar.update.resolves({})

        await runCommand(Cmd, ['--app=myapp'])

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith("NOT_BLANK='not blank'", {
          postfix: '.sh',
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(fakePlatform.configVar.infoForApp.calledTwice).to.equal(true)
        expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {NOT_BLANK: null})).to.equal(true)
      })
    })

    describe('setting config var to blank', function () {
      it('updates the values with blanks', async function () {
        editedConfig = "BLANK=\nNOT_BLANK=''\n"
        fakePlatform.configVar.infoForApp.resolves({NOT_BLANK: 'not blank'})
        fakePlatform.configVar.update.resolves({BLANK: '', NOT_BLANK: 'not blank'})

        await runCommand(Cmd, ['--app=myapp'])

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith("NOT_BLANK='not blank'", {
          postfix: '.sh',
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {BLANK: '', NOT_BLANK: ''})).to.be.true
      })
    })

    describe('setting specific var', function () {
      it('updates the values with blanks', async function () {
        editedConfig = 'a'
        fakePlatform.configVar.infoForApp.resolves({FIRST: '1', SECOND: '2'})
        fakePlatform.configVar.update.resolves({DOES_NOT: 'matter'})

        await runCommand(Cmd, ['--app=myapp', 'FIRST'])

        expect(createEditorStub.calledOnce).to.be.true
        expect(editorEditStub.calledOnce).to.be.true
        expect(editorEditStub.calledWith('1', {
          prefix: 'heroku-myapp-config-',
        })).to.be.true
        expect(fakePlatform.configVar.update.calledOnceWithExactly('myapp', {FIRST: 'a', SECOND: '2'})).to.be.true
      })
    })
  })
})
