import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import * as sinon from 'sinon'
import * as fs from 'node:fs/promises'
import {AddOnAttachment} from '@heroku-cli/schema'
import Cmd from '../../../../src/commands/addons/open'
import * as path from 'node:path'

describe('The addons:open command', function () {
  // const urlOpenerStub = sinon.stub(Cmd, 'urlOpener').callsFake(async (_: string) => {})
  let urlOpenerStub: sinon.SinonStub

  beforeEach(function () {
    urlOpenerStub = sinon.stub(Cmd, 'urlOpener').callsFake(async () => {})
    urlOpenerStub.reset()
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('should only print the url when --show-url is used', async function () {
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addon-attachments/resolve', {app: 'myApp', addon_attachment: 'db2'})
      .reply(404, {app: 'myApp', addon_attachment: 'db2', addon_service: undefined})
      .post('/actions/addons/resolve', {app: 'myApp', addon: 'db2'})
      .reply(200, [{id: 'db2', web_url: 'http://db2', addon_service: undefined}])
      .get('/addons/db2/addon-attachments')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myApp',
      '--show-url',
      'db2',
    ])

    expect(stdout.output).to.equal('http://db2\n')
    return api.done()
  })

  it('should open an attached addon, by slug, with the correct `context_app`.', async function () {
    const api = nock('https://api.heroku.com:443')
      .post('/actions/addon-attachments/resolve', {app: 'myapp-2', addon_attachment: 'slowdb'})
      .reply(404, {resource: 'add_on attachment'})
      .post('/actions/addons/resolve', {app: 'myapp-2', addon: 'slowdb'})
      .reply(404, {resource: 'add_on'})
      .post('/actions/addons/resolve', {app: null, addon: 'slowdb'})
      .reply(200, [{id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b', web_url: 'http://myapp-slowdb'}])
      .get('/addons/c7c9cf20-ec87-11e5-aea4-0002a5d5c51b/addon-attachments')
      .reply(200, [
        {app: {name: 'myapp'}, web_url: 'http://myapp-slowdb'}, {
          app: {name: 'myapp-2'},
          web_url: 'http://myapp-2-slowdb',
        },
      ])
    await runCommand(Cmd, [
      '--app',
      'myapp-2',
      'slowdb',
    ])
    expect(urlOpenerStub.calledWith('http://myapp-2-slowdb')).to.be.true
    expect(stdout.output).to.equal('Opening http://myapp-2-slowdb...\n')
    return api.done()
  })

  describe('should open the specified addon', function () {
    afterEach(function () {
      delete process.env.HEROKU_SUDO
    })

    it('url via the standard happy path.', async function () {
      const responseBody: AddOnAttachment[] = [{name: 'REDIS', web_url: 'https://heroku.com'}]
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: 'myApp', addon_attachment: 'redis-321'})
        .reply(201, responseBody)

      await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis-321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout.output).to.equal('Opening https://heroku.com...\n')
      return api.done()
    })

    it('url when "::" exists in the addon_attachment.', async function () {
      const responseBody: AddOnAttachment[] = [{name: 'REDIS', web_url: 'https://heroku.com'}]
      const api = nock('https://api.heroku.com:443')
        .post('/actions/addon-attachments/resolve', {app: null, addon_attachment: 'redis::321'})
        .reply(201, responseBody)

      await runCommand(Cmd, [
        '--app',
        'myApp',
        'redis::321',
      ])
      expect(urlOpenerStub.calledWith('https://heroku.com')).to.be.true
      expect(stdout.output).to.equal('Opening https://heroku.com...\n')
      return api.done()
    })

    it('url using sudo via sso.', async function () {
      process.env.HEROKU_SUDO = 'true'
      const api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL', method: 'get'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--show-url',
        'db2',
      ])
      expect(urlOpenerStub.calledWith('exampleURL')).to.be.true
      expect(stdout.output).to.equal('Opening exampleURL...\n')
      return api.done()
    })

    it('file path using sudo via sso.', async function () {
      process.env.HEROKU_SUDO = 'true'
      const api = nock('https://api.heroku.com:443')
        .get('/apps/myapp/addons/db2/sso')
        .reply(200, {action: 'exampleURL', method: 'post'})

      await runCommand(Cmd, [
        '--app',
        'myapp',
        '--show-url',
        'db2',
      ])
      const {lastArg} = urlOpenerStub.getCall(0)
      const normalizedPath = String(lastArg).replace(/\//g, path.sep)
      expect(lastArg.startsWith('file:')).to.be.true
      expect(stdout.output).to.equal(`Opening ${lastArg}...\n`)

      const file = await fs.readFile(normalizedPath.replace(`file:${path.sep}${path.sep}`, ''))
      expect(file.toString().includes('Opening db2 on myapp...')).to.be.true
      return api.done()
    })
  })
})
