import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as sinon from 'sinon'
import {SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/certs/generate.js'
import {expectJsonError, expectJsonSnapshot, runCommandJson} from '../../../helpers/json-snapshot.js'
import {endpoint} from '../../../helpers/stubs/sni-endpoints.js'

type FakePlatform = {
  sniEndpoint: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    sniEndpoint: {list: sinon.stub()},
  }
}

const resolveInWorkDir = (file: string) => `/work/certs/${file}`

type FileSeams = {fileExists: (file: string) => Promise<boolean>; restrictToOwner: (file: string) => Promise<void>}

// Stands in for openssl: writes the -keyout and -out files the way LibreSSL does, readable by everyone.
async function writeLikeLibreSSL(args: string[]): Promise<number> {
  await fs.writeFile(args[args.indexOf('-keyout') + 1], 'KEY', {mode: 0o644})
  await fs.writeFile(args[args.indexOf('-out') + 1], 'CSR', {mode: 0o644})
  return 0
}

describe('heroku certs:generate', function () {
  let promptForOwnerInfoStub: SinonStub
  let spawnOpenSSLStub: SinonStub
  let fileExistsStub: SinonStub
  let restrictToOwnerStub: SinonStub
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    fakePlatform.sniEndpoint.list.resolves([endpoint])
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)

    promptForOwnerInfoStub = stub(Cmd.prototype, 'promptForOwnerInfo')
    promptForOwnerInfoStub.returns(Promise.resolve({}))

    spawnOpenSSLStub = stub(Cmd.prototype as any, 'spawnOpenSSL')
    spawnOpenSSLStub.resolves(0)

    fileExistsStub = stub(Cmd.prototype as unknown as FileSeams, 'fileExists').resolves(false)
    restrictToOwnerStub = stub(Cmd.prototype as unknown as FileSeams, 'restrictToOwner').resolves()
  })

  afterEach(function () {
    sinon.restore()
  })

  it('# with certificate prompts emitted if no parts of subject provided', async function () {
    promptForOwnerInfoStub.returns(Promise.resolve({
      area: 'California',
      city: 'San Francisco',
      country: 'US',
      owner: 'Heroku',
    }))

    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.true
    expect(stdout).to.equal('')
    expect(spawnOpenSSLStub
      .calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/C=US/ST=California/L=San Francisco/O=Heroku/CN=example.com']))
      .to.be.true
  })

  it('# not emitted if any part of subject is specified', async function () {
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--owner',
      'Heroku',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/O=Heroku/CN=example.com'])).to.be.true
  })

  it('# not emitted if --now is specified', async function () {
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# not emitted if --subject is specified', async function () {
    const {stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--subject',
      'SOMETHING',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', 'SOMETHING'])).to.be.true
  })

  it('# without --selfsigned does not request a self-signed certificate', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.com.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.com.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.csr', '-subj', '/CN=example.com'])).to.be.true
  })

  it('# with --selfsigned does request a self-signed certificate', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--selfsigned',
      'example.com',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Your key and self-signed certificate have been generated.\nNext, run:\n$ heroku certs:add example.com.crt example.com.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.com.key', '-out', 'example.com.crt', '-subj', '/CN=example.com', '-x509'])).to.be.true
  })

  it('# suggests next step should be certs:update when domain is known in sni', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
    expect(fakePlatform.sniEndpoint.list.calledOnceWithExactly('example')).to.equal(true)
  })

  it('# suggests next step should be certs:update when domain is known in ssl', async function () {
    fakePlatform.sniEndpoint.list.resolves([])
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:add CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('# key size can be changed using keysize', async function () {
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--now',
      '--keysize',
      '4096',
      'example.org',
    ])
    expect(promptForOwnerInfoStub.called).to.be.false
    expect(stdout).to.equal('')
    expect(stderr).to.equal('Your key and certificate signing request have been generated.\nSubmit the CSR in \'example.org.csr\' to your preferred certificate authority.\nWhen you\'ve received your certificate, run:\n$ heroku certs:update CERTFILE example.org.key\n')
    expect(spawnOpenSSLStub.calledWith(['req', '-new', '-newkey', 'rsa:4096', '-nodes', '-keyout', 'example.org.key', '-out', 'example.org.csr', '-subj', '/CN=example.org'])).to.be.true
  })

  it('makes the key readable only by its owner after openssl writes it', async function () {
    await runCommand(Cmd, ['--app', 'example', '--now', 'example.com'])

    expect(restrictToOwnerStub.calledOnceWithExactly('example.com.key')).to.equal(true)
    expect(restrictToOwnerStub.calledAfter(spawnOpenSSLStub)).to.equal(true)
  })

  for (const domain of ['../example.com', String.raw`..\example.com`, '-config']) {
    it(`rejects the domain ${domain} before anything runs`, async function () {
      const {error} = await runCommand(Cmd, ['--app', 'example', '--now', '--', domain])

      expect(error?.message).to.equal(`Invalid domain ${domain}: a domain can't contain / or \\, or start with -.`)
      expect(fakePlatform.sniEndpoint.list.called).to.equal(false)
      expect(spawnOpenSSLStub.called).to.equal(false)
    })
  }

  it('refuses to overwrite an existing key', async function () {
    fileExistsStub.withArgs('example.com.key').resolves(true)

    const {error} = await runCommand(Cmd, ['--app', 'example', 'example.com'])

    expect(error?.message).to.equal('example.com.key already exists. Pass --force to overwrite it.')
    expect(promptForOwnerInfoStub.called).to.equal(false)
    expect(spawnOpenSSLStub.called).to.equal(false)
  })

  it('refuses to overwrite an existing key and certificate with --selfsigned', async function () {
    fileExistsStub.withArgs('example.com.key').resolves(true)
    fileExistsStub.withArgs('example.com.crt').resolves(true)

    const {error} = await runCommand(Cmd, ['--app', 'example', '--now', '--selfsigned', 'example.com'])

    expect(error?.message).to.equal('example.com.key and example.com.crt already exist. Pass --force to overwrite them.')
    expect(fileExistsStub.calledWith('example.com.csr')).to.equal(false)
  })

  it('overwrites existing files with --force', async function () {
    fileExistsStub.resolves(true)

    const {error} = await runCommand(Cmd, ['--app', 'example', '--now', '--force', 'example.com'])

    expect(error).to.equal(undefined)
    expect(fileExistsStub.called).to.equal(false)
    expect(spawnOpenSSLStub.calledOnce).to.equal(true)
  })

  context('in a real directory', function () {
    let cwd: string
    let workDir: string

    beforeEach(async function () {
      fileExistsStub.restore()
      restrictToOwnerStub.restore()
      spawnOpenSSLStub.callsFake(writeLikeLibreSSL)
      cwd = process.cwd()
      workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'certs-generate-'))
      process.chdir(workDir)
    })

    afterEach(async function () {
      process.chdir(cwd)
      await fs.rm(workDir, {force: true, recursive: true})
    })

    it('leaves the key readable only by its owner', async function () {
      if (process.platform === 'win32') this.skip() // Windows has no POSIX mode bits.

      await runCommand(Cmd, ['--app', 'example', '--now', 'example.com'])

      expect(((await fs.stat('example.com.key')).mode % 0o1000).toString(8)).to.equal('600')
    })

    it('finds an existing CSR', async function () {
      await fs.writeFile('example.com.csr', 'OLD CSR')

      const {error} = await runCommand(Cmd, ['--app', 'example', '--now', 'example.com'])

      expect(error?.message).to.equal('example.com.csr already exists. Pass --force to overwrite it.')
      expect(await fs.readFile('example.com.csr', 'utf8')).to.equal('OLD CSR')
    })
  })

  describe('--json', function () {
    context('with a fixed working directory', function () {
      beforeEach(function () {
        // Absolute paths differ per machine and OS, so the snapshots pin the directory.
        stub(Cmd.prototype as unknown as {resolvePath: (file: string) => string}, 'resolvePath').callsFake(resolveInWorkDir)
      })

      it('returns the absolute paths of the key and CSR', async function () {
        const {stderr} = await expectJsonSnapshot(this, Cmd, ['example.com', '--app', 'example', '--now'])

        // The next-step hints are human output, so --json leaves them out.
        expect(stderr).to.not.contain('have been generated')
      })

      it('returns the absolute paths of the key and certificate with --selfsigned', async function () {
        const {stderr} = await expectJsonSnapshot(this, Cmd, ['example.com', '--app', 'example', '--owner', 'Heroku', '--selfsigned'])

        expect(stderr).to.not.contain('have been generated')
      })
    })

    it('resolves the paths against the current directory', async function () {
      const {json} = await runCommandJson<{csr: string; key: string}>(Cmd, ['example.com', '--app', 'example', '--now'])

      expect(json.key).to.equal(path.resolve('example.com.key'))
      expect(json.csr).to.equal(path.resolve('example.com.csr'))
    })

    it('fails with an error document when the API rejects', async function () {
      fakePlatform.sniEndpoint.list.rejects(new Error('Couldn\'t find that app.'))

      await expectJsonError(Cmd, ['example.com', '--app', 'example', '--now'], 'Couldn\'t find that app.')

      expect(spawnOpenSSLStub.called).to.equal(false)
    })

    it('requires owner information instead of prompting', async function () {
      await expectJsonError(Cmd, ['example.com', '--app', 'example'], 'Pass --now, --subject, or at least one of --owner, --country, --area or --city. Commands don\'t prompt for owner information with --json.')

      expect(promptForOwnerInfoStub.called).to.equal(false)
      expect(spawnOpenSSLStub.called).to.equal(false)
    })
  })
})
