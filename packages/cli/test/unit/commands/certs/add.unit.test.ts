import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import * as fs from 'node:fs/promises'
import * as sinon from 'sinon'
import * as inquirer from 'inquirer'
import {QuestionCollection} from 'inquirer'
import heredoc from 'tsheredoc'
import {
  endpoint,
  endpointStables,
  endpointWildcard,
  certificateDetails,
  endpointWarning,
  endpointHeroku,
} from '../../../helpers/stubs/sni-endpoints'
import Cmd from '../../../../src/commands/certs/add'
import {expect} from '@oclif/test'
import {SinonStub} from 'sinon'
import {PathLike} from 'node:fs'

let stubbedPromptReturnValue: unknown = {}
let questionsReceived: ReadonlyArray<inquirer.Answers> | undefined
const stubbedPrompt = sinon.stub(inquirer, 'prompt')
  .callsFake((questions: QuestionCollection<inquirer.Answers>) => {
    questionsReceived = questions as ReadonlyArray<inquirer.Answers>
    return Promise.resolve(stubbedPromptReturnValue) as ReturnType<typeof inquirer.prompt>
  })

function mockDomains() {
  nock('https://api.heroku.com')
    .get('/apps/example/domains')
    .reply(200, [])
  stubbedPromptReturnValue = {domains: []}
}

type ReadFileStub = SinonStub<Parameters<typeof fs.readFile>, ReturnType<typeof fs.readFile>>

function mockFile(readFileStub: ReadFileStub, file: PathLike, content: string) {
  readFileStub.withArgs(file, {encoding: 'utf-8'}).returns(Promise.resolve(content))
}

describe('heroku certs:add', async () => {
  let stubbedReadFile: SinonStub<Parameters<typeof fs.readFile>, ReturnType<typeof fs.readFile>>

  beforeEach(async () => {
    stubbedReadFile = sinon.stub(fs, 'readFile')
    questionsReceived = undefined
    nock.cleanAll()
  })

  afterEach(function () {
    stubbedReadFile.restore()
  })

  after(() => {
    stubbedPrompt.restore()
  })

  it('# works with a cert and key', async () => {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})
    mockDomains()
    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')
    const mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)
    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])
    mockSni.done()
    expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
    expect(stdout.output).to.equal(`example now served by tokyo-1050.herokussl.com\nCertificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# displays warnings', async () => {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})
    mockDomains()
    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')
    const mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpointWarning)
    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])
    mockSni.done()
    expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
  })

  it('# creates an SNI endpoint', async () => {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})
    mockDomains()
    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')
    const mock = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)
    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])
    mock.done()
    expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
    expect(stdout.output).to.eq(`example now served by tokyo-1050.herokussl.com\nCertificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# shows the configure prompt', async () => {
    nock('https://api.heroku.com')
      .get('/apps/example')
      .reply(200, {space: null})
    nock('https://api.heroku.com')
      .get('/apps/example/domains')
      .reply(200, [{id: 123, hostname: 'example.org'}])
    mockDomains()
    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')
    const mockSni = nock('https://api.heroku.com')
      .post('/apps/example/sni-endpoints', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)
    await runCommand(Cmd, [
      '--app',
      'example',
      'pem_file',
      'key_file',
    ])
    mockSni.done()
    expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
    expect(stdout.output).to.eq(`example now served by tokyo-1050.herokussl.com\nCertificate details:\n${heredoc(certificateDetails)}=== Almost done! Which of these domains on this application would you like this certificate associated with?\n\n`)
  })

  describe('stable cnames', async () => {
    beforeEach(async () => {
      nock('https://api.heroku.com')
        .get('/apps/example')
        .reply(200, {space: null})
      mockFile(stubbedReadFile, 'pem_file', 'pem content')
      mockFile(stubbedReadFile, 'key_file', 'key content')
    })

    it('# prompts creates an SNI endpoint with stable cnames', async () => {
      const mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointStables)
      const domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: 'biz.example.com', cname: 'biz.example.com.herokudns.com'}, {
            kind: 'custom',
            hostname: 'baz.example.org',
            cname: 'baz.example.org.herokudns.com',
          }, {kind: 'custom', hostname: 'example.org', cname: 'example.org.herokudns.com'}, {
            kind: 'custom',
            hostname: 'example.co.uk',
            cname: 'example.co.uk.herokudns.com',
          }, {kind: 'heroku', hostname: 'haiku.herokuapp.com', cname: 'haiku.herokuapp.com'},
        ])

      const domainsCreate = nock('https://api.heroku.com')
        .patch('/apps/example/domains/biz.example.com')
        .reply(200)

      stubbedPromptReturnValue = {domains: ['biz.example.com']}
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'key_file',
      ])
      expect(questionsReceived).not.to.be.undefined
      expect(questionsReceived?.[0].choices).to.eql([
        'biz.example.com',
      ])
      mock.done()
      domainsMock.done()
      domainsCreate.done()
      expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
      expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): foo.example.org\n                bar.example.org\n                biz.example.com\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.\n=== Almost done! Which of these domains on this application would you like this certificate associated with?')
    })

    it('# does not error out if the cert CN is for the heroku domain', async () => {
      const mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointHeroku)
      const domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        ])
      const domainsMockPatch = nock('https://api.heroku.com')
        .patch('/apps/example/domains/tokyo-1050.herokuapp.com')
        .reply(200, [
          {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null},
        ])

      stubbedPromptReturnValue = {domains: ['tokyo-1050.herokuapp.com']}
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'key_file',
      ])
      expect(questionsReceived?.[0].choices).to.eql([
        'tokyo-1050.herokuapp.com',
      ])
      mock.done()
      domainsMock.done()
      domainsMockPatch.done()
      expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
      expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): tokyo-1050.herokuapp.com\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=heroku.com\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=tokyo-1050.herokuapp.com\nSSL certificate is not trusted.\n=== Almost done! Which of these domains on this application would you like this certificate associated with?')
    })

    it('# does not prompt if domains covered with wildcard', async () => {
      const mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointStables)
      const domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: '*.example.org', cname: 'wildcard.example.org.herokudns.com'}, {
            kind: 'custom',
            hostname: '*.example.com',
            cname: 'wildcard.example.com.herokudns.com',
          },
        ])
      stubbedPromptReturnValue = {domains: ['tokyo-1050.herokuapp.com']}
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'key_file',
      ])
      expect(questionsReceived).to.be.undefined
      mock.done()
      domainsMock.done()
      expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
      expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): foo.example.org\n                bar.example.org\n                biz.example.com\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.')
    })

    it('# does not prompt if no domains and wildcard cert', async () => {
      const mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointWildcard)
      const domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [])

      stubbedPromptReturnValue = {domains: ['tokyo-1050.herokuapp.com']}
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'key_file',
      ])
      expect(questionsReceived).to.be.undefined
      mock.done()
      domainsMock.done()
      expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
      expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): *.example.org\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.')
    })

    it('# prints mismatched domains for wildcard cert', async () => {
      const mock = nock('https://api.heroku.com')
        .post('/apps/example/sni-endpoints', {
          certificate_chain: 'pem content', private_key: 'key content',
        })
        .reply(200, endpointWildcard)
      const domainsMock = nock('https://api.heroku.com')
        .get('/apps/example/domains')
        .reply(200, [
          {kind: 'custom', hostname: 'foo.example.org', cname: 'foo.example.org.herokudns.com'}, {
            kind: 'custom',
            hostname: 'bar.example.com',
            cname: 'bar.example.com.herokudns.com',
          },
        ])
      const domainsMockPatch = nock('https://api.heroku.com')
        .patch('/apps/example/domains/foo.example.org')
        .reply(200)

      stubbedPromptReturnValue = {domains: ['foo.example.org']}
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'key_file',
      ])
      expect(questionsReceived?.[0].choices).to.eql([
        'foo.example.org',
      ])
      mock.done()
      domainsMock.done()
      domainsMockPatch.done()
      expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
      expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): *.example.org\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.\n=== Almost done! Which of these domains on this application would you like this certificate associated with?')
    })
    describe('waiting for domains', async () => {
      let timeoutStub: SinonStub
      beforeEach(function () {
        timeoutStub = sinon.stub(globalThis, 'setTimeout')
        timeoutStub.callsArgWith(0)
      })

      afterEach(function () {
        timeoutStub.restore()
      })

      it('# waits for custom domains to have a cname', async () => {
        const mock = nock('https://api.heroku.com')
          .post('/apps/example/sni-endpoints', {
            certificate_chain: 'pem content', private_key: 'key content',
          })
          .reply(200, endpointStables)
        const domainsMock = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'foo.example.org',
              cname: null,
              status: 'none',
            }, {kind: 'custom', hostname: 'bar.example.org', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'biz.example.com',
              cname: null,
              status: 'none',
            },
          ])
        const domainsRetry = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'foo.example.org',
              cname: null,
              status: 'none',
            }, {
              kind: 'custom',
              hostname: 'bar.example.org',
              cname: 'bar.example.org.herokudns.com',
              status: 'succeeded',
            }, {
              kind: 'custom',
              hostname: 'biz.example.com',
              cname: 'biz.example.com.herokudns.com',
              status: 'succeeded',
            },
          ])
        const domainsSuccess = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'foo.example.org',
              cname: 'foo.example.org.herokudns.com',
              status: 'succeeded',
            }, {
              kind: 'custom',
              hostname: 'bar.example.org',
              cname: 'bar.example.org.herokudns.com',
              status: 'succeeded',
            }, {
              kind: 'custom',
              hostname: 'biz.example.com',
              cname: 'biz.example.com.herokudns.com',
              status: 'succeeded',
            },
          ])
        const domainsCreateFoo = nock('https://api.heroku.com')
          .patch('/apps/example/domains/foo.example.org')
          .reply(200)
        const domainsCreateBar = nock('https://api.heroku.com')
          .patch('/apps/example/domains/bar.example.org')
          .reply(200)
        const domainsCreateBiz = nock('https://api.heroku.com')
          .patch('/apps/example/domains/biz.example.com')
          .reply(200)

        stubbedPromptReturnValue = {domains: [
          'foo.example.org',
          'bar.example.org',
          'biz.example.com',
        ]}
        await runCommand(Cmd, [
          '--app',
          'example',
          'pem_file',
          'key_file',
        ])
        expect(questionsReceived?.[0].choices).to.eql([
          'foo.example.org',
          'bar.example.org',
          'biz.example.com',
        ])
        mock.done()
        domainsMock.done()
        domainsRetry.done()
        domainsSuccess.done()
        domainsCreateFoo.done()
        domainsCreateBar.done()
        domainsCreateBiz.done()
        expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
        expect(stderr.output).to.contain('Waiting for stable domains to be created... done\n')
        expect(stdout.output.trim()).to.equal('Certificate details:\nCommon Name(s): foo.example.org\n                bar.example.org\n                biz.example.com\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.\n=== Almost done! Which of these domains on this application would you like this certificate associated with?')
      })

      it('# tries 30 times and then gives up', async () => {
        const mock = nock('https://api.heroku.com')
          .post('/apps/example/sni-endpoints', {
            certificate_chain: 'pem content', private_key: 'key content',
          })
          .reply(200, endpointStables)
        const domainsMock = nock('https://api.heroku.com')
          .get('/apps/example/domains')
          .times(30)
          .reply(200, [
            {kind: 'heroku', hostname: 'tokyo-1050.herokuapp.com', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'foo.example.org',
              cname: null,
              status: 'none',
            }, {kind: 'custom', hostname: 'bar.example.org', cname: null, status: 'none'}, {
              kind: 'custom',
              hostname: 'biz.example.com',
              cname: null,
              status: 'none',
            },
          ])
        try {
          await runCommand(Cmd, [
            '--app',
            'example',
            'pem_file',
            'key_file',
          ])
        } catch (error) {
          const {message} = error as {message:string}
          expect(message).to.contain('Timed out while waiting for stable domains to be created')
        }

        mock.done()
        domainsMock.done()
        expect(stderr.output).to.contain('Adding SSL certificate to example... done\n')
        expect(stderr.output).to.contain('Waiting for stable domains to be created... !\n')
        expect(stdout.output).to.equal('Certificate details:\nCommon Name(s): foo.example.org\n                bar.example.org\n                biz.example.com\nExpires At:     2013-08-01 21:34 UTC\nIssuer:         /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nStarts At:      2012-08-01 21:34 UTC\nSubject:        /C=US/ST=California/L=San Francisco/O=Heroku by Salesforce/CN=secure.example.org\nSSL certificate is self signed.\n')
      })
    })
  })
})
