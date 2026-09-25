import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import fs from 'fs-extra'
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from 'mocha'
import nock from 'nock'
import os from 'node:os'
import path from 'node:path'
import {restore, SinonStub, stub} from 'sinon'

import DataPgGetCa from '../../../../../src/commands/data/pg/get-ca.js'

describe('data:pg:get-ca', function () {
  const certificate = '-----BEGIN CERTIFICATE-----\ncertificate\n-----END CERTIFICATE-----\n'
  const destinationDirectory = () => process.platform === 'win32'
    ? path.join(process.env.APPDATA ?? '', 'postgresql')
    : path.join(os.homedir(), '.postgresql')
  let outputFileStub: SinonStub

  beforeEach(function () {
    outputFileStub = stub(fs, 'outputFile').resolves()
  })

  afterEach(function () {
    restore()
    nock.cleanAll()
  })

  it('downloads the CA bundle for an AWS-backed Heroku region', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, [{name: 'virginia', provider: {region: 'us-east-1'}}])
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/us-east-1/us-east-1-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'virginia'])
    const destination = path.join(destinationDirectory(), 'us-east-1-bundle.pem')

    expect(outputFileStub.calledOnceWith(
      destination,
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal(`RDS CA bundle retrieved successfully: ${destination}\n`)
  })

  it('downloads the AWS global CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/global/global-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'global'])
    const destination = path.join(destinationDirectory(), 'global-bundle.pem')

    expect(outputFileStub.calledOnceWith(
      destination,
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal(`RDS CA bundle retrieved successfully: ${destination}\n`)
  })

  it('downloads the US Common Runtime CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/us-east-1/us-east-1-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'us'])
    const destination = path.join(destinationDirectory(), 'us-east-1-bundle.pem')

    expect(outputFileStub.calledOnceWith(
      destination,
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal(`RDS CA bundle retrieved successfully: ${destination}\n`)
  })

  it('downloads the EU Common Runtime CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/eu-west-1/eu-west-1-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'eu'])
    const destination = path.join(destinationDirectory(), 'eu-west-1-bundle.pem')

    expect(outputFileStub.calledOnceWith(
      destination,
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal(`RDS CA bundle retrieved successfully: ${destination}\n`)
  })

  it('denies retrieval when AWS cannot provide the CA bundle', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, [{name: 'virginia', provider: {region: 'us-east-1'}}])
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/us-east-1/us-east-1-bundle.pem')
      .reply(503, 'temporarily unavailable')

    const {error: commandError} = await runCommand(DataPgGetCa, ['--region', 'virginia'])
    const destination = path.join(destinationDirectory(), 'us-east-1-bundle.pem')
    expect(commandError?.message).to.equal(`Unable to retrieve the RDS CA bundle at ${destination}: AWS RDS returned 503 Service Unavailable.`)
    expect(outputFileStub.called).to.be.false
  })

  it('rejects non-AWS Heroku regions', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, [{name: 'example', provider: {region: null}}])

    const {error} = await runCommand(DataPgGetCa, ['--region', 'example'])
    const destination = path.join(destinationDirectory(), '')
    expect(error?.message).to.equal(`Unable to retrieve the RDS CA bundle at ${destination}: example is not a Heroku region backed by AWS.`)
  })
})
