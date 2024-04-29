import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/certs/update'
import runCommand from '../../../helpers/runCommand'
import heredoc from 'tsheredoc'
import * as nock from 'nock'
import {endpoint, certificateDetails} from '../../../helpers/stubs/sni-endpoints'
import sharedSni = require('./shared_sni.unit.test')
import {SniEndpoint} from '../../../../src/lib/types/sni_endpoint'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')
import * as fs from 'node:fs/promises'
import {PathLike} from 'node:fs'
import * as sinon from 'sinon'
import {CLIError} from '@oclif/core/lib/errors'

describe('heroku certs:update', function () {
  type ReadFileStub = sinon.SinonStub<Parameters<typeof fs.readFile>, ReturnType<typeof fs.readFile>>

  function mockFile(readFileStub: ReadFileStub, file: PathLike, content: string) {
    readFileStub.withArgs(file, {encoding: 'utf-8'}).returns(Promise.resolve(content))
  }

  let stubbedReadFile: ReadFileStub

  beforeEach(function () {
    stubbedReadFile = sinon.stub(fs, 'readFile')
  })

  afterEach(function () {
    stubbedReadFile.restore()
    nock.cleanAll()
  })

  it('# requires confirmation', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--confirm',
        'notexample',
        'pem_file',
        'key_file',
      ])
    } catch (error) {
      const {message} = error as Error
      expect(stripAnsi(message)).to.equal('Confirmation notexample did not match example. Aborted.')
    }

    api.done()
    expect(stdout.output).to.equal('')
  })

  it('# errors out when args < 2', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
      ])
    } catch (error) {
      const {message, oclif} = error as CLIError
      expect(stripAnsi(message)).to.equal('Missing 1 required arg:\nKEY\nSee more help with --help')
      expect(oclif.exit).to.equal(2)
    }

    expect(stdout.output).to.equal('')
  })

  it('# can run', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .patch('/apps/example/sni-endpoints/tokyo-1050', {
        certificate_chain: 'pem content', private_key: 'key content',
      })
      .reply(200, endpoint)

    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')

    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
      'pem_file',
      'key_file',
    ])

    api.done()
    expect(stderr.output).to.equal(heredoc`
      Updating SSL certificate tokyo-1050 for example...
      Updating SSL certificate tokyo-1050 for example... done
    `)
    expect(stdout.output).to.equal(`Updated certificate details:\n${heredoc(certificateDetails)}`)
  })

  it('# errors out with intermediaries', async function () {
    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        'pem_file',
        'int_file',
        'key_file',
      ])
    } catch (error) {
      const {message, oclif} = error as CLIError
      expect(stripAnsi(message)).to.equal('Unexpected argument: key_file\nSee more help with --help')
      expect(oclif.exit).to.equal(2)
    }

    expect(stdout.output).to.equal('')
  })
})

describe('shared', function () {
  type ReadFileStub = sinon.SinonStub<Parameters<typeof fs.readFile>, ReturnType<typeof fs.readFile>>

  function mockFile(readFileStub: ReadFileStub, file: PathLike, content: string) {
    readFileStub.withArgs(file, {encoding: 'utf-8'}).returns(Promise.resolve(content))
  }

  let stubbedReadFile: ReadFileStub

  beforeEach(function () {
    stubbedReadFile = sinon.stub(fs, 'readFile')
    mockFile(stubbedReadFile, 'pem_file', 'pem content')
    mockFile(stubbedReadFile, 'key_file', 'key content')
  })

  afterEach(function () {
    stubbedReadFile.restore()
  })

  const callback = function (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) {
    if (err)
      throw err

    return nock('https://api.heroku.com')
      .patch(path, {certificate_chain: 'pem content', private_key: 'key content'})
      .reply(200, endpoint)
  }

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc`
      Updating SSL certificate ${endpoint.name} for example...
      Updating SSL certificate ${endpoint.name} for example... done\n
    `
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stdout = function (certificateDetails: string, _endpoint: Partial<SniEndpoint>) {
    return `Updated certificate details:\n${heredoc(certificateDetails)}\n`
  }

  sharedSni.shouldHandleArgs('certs:update', Cmd, callback, {stdout, stderr, flags: {confirm: 'example'}, args: ['pem_file', 'key_file']})
})
