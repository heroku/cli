import {cli} from 'cli-ux'
import sinon from 'sinon'

import {stringToConfig, showDiff} from '../../../src/commands/config/edit'
import {Editor} from '../../../src/util'
import {expect, test} from '../../test'

let sandbox: any
let updated: {}
let editedConfig = ''
let beforeConfigString = ''
let afterConfigString = ''
let logSpy: any

describe('config:edit', () => {
  describe('stringToConfig', () => {
    it('handles config vars with empty string values', () => {
      expect(stringToConfig("foo=''")).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=""')).to.deep.equal({foo: ''})
      expect(stringToConfig('foo=')).to.deep.equal({foo: ''})
    })
  })

  describe('showDiff', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox()
      logSpy = sandbox.spy(cli, 'log')
    })

    afterEach(() => {
      sandbox.restore()
    })

    describe('key diff', () => {
      beforeEach(() => {
        beforeConfigString = "foo='bar'"
        afterConfigString = "foo='baz'"
      })

      it('renders the diff with + and -', ()  => {
        showDiff(stringToConfig(beforeConfigString), stringToConfig(afterConfigString))
        expect(logSpy.withArgs("- foo='bar'").calledOnce)
        expect(logSpy.withArgs("+ foo='baz'").calledOnce)
      })
    })

    describe('no key diff', () => {
      beforeEach(() => {
        beforeConfigString = "foo='bar'"
        afterConfigString = "foo='bar'"
      })

      it('does not log', ()  => {
        showDiff(stringToConfig(beforeConfigString), stringToConfig(afterConfigString))
        expect(logSpy.notCalled)
      })
    })
  })

  describe('blank config vars', () => {
    beforeEach(() => {
      sandbox = sinon.createSandbox()
      sandbox.stub(Editor.prototype, 'edit')
      .callsFake(() => {
        return Promise.resolve(editedConfig)
      })
      sandbox.stub(cli, 'confirm')
      .value(() => {
        return Promise.resolve(true)
      })
      sandbox.stub(cli, 'log')
      .value(() => {
        return Promise.resolve()
      })
      sandbox.stub(cli.action, 'start')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .value(() => {})
      sandbox.stub(cli.action, 'stop')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .value(() => {})
    })

    afterEach(() => {
      sandbox.restore()
    })

    describe('deleting config var', () => {
      beforeEach(() => {
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
      .reply(function (_uri: string, requestBody: {}) {
        updated = requestBody
        return [200, {}]
      }),
      )
      .command(['config:edit', '--app=myapp'])
      .it('nulls out vars to delete', () => {
        expect(updated).to.deep.equal({NOT_BLANK: null})
      })
    })

    describe('setting config var to blank', () => {
      beforeEach(() => {
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
      .reply(function (_uri: string, requestBody: {}) {
        updated = requestBody
        return [200, {NOT_BLANK: 'not blank', BLANK: ''}]
      }),
      )
      .command(['config:edit', '--app=myapp'])
      .it('updates the values with blanks', () => {
        expect(updated).to.deep.equal({BLANK: '', NOT_BLANK: ''})
      })
    })
  })
})
