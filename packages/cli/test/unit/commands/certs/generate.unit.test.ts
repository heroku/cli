import Cmd  from '../../../../src/commands/certs/generate'
import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {endpoint} from '../../../helpers/stubs/sni-endpoints'
import * as sinon from 'sinon'
import {expect} from '@oclif/test'
import {QuestionCollection} from 'inquirer'
import * as inquirer from 'inquirer'
import * as childProcess from 'node:child_process'
import {SinonStub} from 'sinon'

describe('heroku certs:generate', function () {
  let childProcessStub: SinonStub
  let stubbedPrompt: SinonStub
  let stubbedPromptReturnValue: unknown = {}
  let questionsReceived: ReadonlyArray<inquirer.Answers> | undefined
  beforeEach(() => {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    stubbedPrompt = sinon.stub(inquirer, 'prompt')
    stubbedPrompt.callsFake((questions: QuestionCollection<inquirer.Answers>) => {
      questionsReceived = questions as ReadonlyArray<inquirer.Answers>
      return Promise.resolve(stubbedPromptReturnValue) as ReturnType<typeof inquirer.prompt>
    })

    questionsReceived = undefined
  })

  before(function () {
    // sinon.restore()
    childProcessStub = sinon.stub(childProcess, 'spawn')
    childProcessStub.callsFake(() => {
      return {
        once: (event: string, cb: CallableFunction) => {
          if (event === 'close') {
            cb()
          }
        },
        unref: () => {},
      }
    })
  })

  afterEach(() => {
    stubbedPrompt.restore()
  })

  after(function () {
    childProcessStub.restore()
  })

  it('# with certificate prompts emitted if no parts of subject provided', async () => {
    stubbedPromptReturnValue = {owner: 'Heroku', country: 'US', area: 'California', city: 'San Francisco'}

    await runCommand(Cmd, [
      '--app',
      'example',
      'example.com',
    ])
    expect(questionsReceived).to.deep.equal([
      {
        type: 'input',
        message: 'Owner of this certificate',
        name: 'owner',
      },
      {
        type: 'input',
        message: 'Country of owner (two-letter ISO code)',
        name: 'country',
      },
      {
        type: 'input',
        message: 'State/province/etc. of owner',
        name: 'area',
      },
      {
        type: 'input',
        message: 'City of owner',
        name: 'city',
      },
    ])
    expect(stdout.output).to.equal('')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/C=US/ST=California/L=San Francisco/O=Heroku/CN=example.com'])).to.be.true
  })

  it('# not emitted if any part of subject is specified', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--owner',
      'Heroku',
      'example.com',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/O=Heroku/CN=example.com'])).to.be.true
  })

  it('# not emitted if --now is specified', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# not emitted if --subject is specified', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--subject',
      'SOMETHING',
      'example.com',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', 'SOMETHING'])).to.be.true
  })
  it('# without --selfsigned does not request a self-signed certificate', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.com.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.com.key\n')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# with --selfsigned does request a self-signed certificate', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--selfsigned',
      'example.com',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and self-signed certificate have been generated.\nNext, run:\n$ heroku certs:add example.com.crt example.com.key\n')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.crt', '-subj', '/CN=example.com', '-x509'])).to.be.true
  })

  it('# suggests next step should be certs:update when domain is known in sni', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('# suggests next step should be certs:update when domain is known in ssl', async () => {
    nock.cleanAll()
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.org.key\n')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('# key size can be changed using keysize', async () => {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--keysize',
      '4096',
      'example.org',
    ])
    expect(stubbedPrompt.called).to.be.false
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(childProcessStub.calledWith('openssl', ['req', '-new', '-newkey', 'rsa:4096', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })
})
