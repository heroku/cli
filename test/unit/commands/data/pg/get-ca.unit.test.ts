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
import {restore, SinonStub, stub} from 'sinon'

import DataPgGetCa from '../../../../../src/commands/data/pg/get-ca.js'

describe('data:pg:get-ca', function () {
  const certificate = '-----BEGIN CERTIFICATE-----\ncertificate\n-----END CERTIFICATE-----\n'
  const destinationDirectory = '/tmp/postgres'
  let outputFileStub: SinonStub

  beforeEach(function () {
    stub(DataPgGetCa.prototype, 'destinationDirectory').returns(destinationDirectory)
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

    expect(outputFileStub.calledOnceWith(
      '/tmp/postgres/us-east-1-bundle.pem',
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal('RDS CA bundle retrieved successfully: /tmp/postgres/us-east-1-bundle.pem\n')
  })

  it('downloads the AWS global CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/global/global-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'global'])

    expect(outputFileStub.calledOnceWith(
      '/tmp/postgres/global-bundle.pem',
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal('RDS CA bundle retrieved successfully: /tmp/postgres/global-bundle.pem\n')
  })

  it('downloads the US Common Runtime CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/us-east-1/us-east-1-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'us'])

    expect(outputFileStub.calledOnceWith(
      '/tmp/postgres/us-east-1-bundle.pem',
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal('RDS CA bundle retrieved successfully: /tmp/postgres/us-east-1-bundle.pem\n')
  })

  it('downloads the EU Common Runtime CA bundle without requesting Heroku regions', async function () {
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/eu-west-1/eu-west-1-bundle.pem')
      .reply(200, certificate)

    const {stdout} = await runCommand(DataPgGetCa, ['--region', 'eu'])

    expect(outputFileStub.calledOnceWith(
      '/tmp/postgres/eu-west-1-bundle.pem',
      Buffer.from(certificate),
      {mode: 0o600},
    )).to.be.true
    expect(stdout).to.equal('RDS CA bundle retrieved successfully: /tmp/postgres/eu-west-1-bundle.pem\n')
  })

  it('denies retrieval when AWS cannot provide the CA bundle', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, [{name: 'virginia', provider: {region: 'us-east-1'}}])
    nock('https://truststore.pki.rds.amazonaws.com')
      .get('/us-east-1/us-east-1-bundle.pem')
      .reply(503, 'temporarily unavailable')

    const error = 'Unable to retrieve the RDS CA bundle at /tmp/postgres/us-east-1-bundle.pem: AWS RDS returned 503 Service Unavailable.'
    const {error: commandError} = await runCommand(DataPgGetCa, ['--region', 'virginia'])
    expect(commandError?.message).to.equal(error)
    expect(outputFileStub.called).to.be.false
  })

  it('rejects non-AWS Heroku regions', async function () {
    nock('https://api.heroku.com')
      .get('/regions')
      .reply(200, [{name: 'example', provider: {region: null}}])

    const {error} = await runCommand(DataPgGetCa, ['--region', 'example'])
    expect(error?.message).to.equal('example is not a Heroku region backed by AWS.')
  })
})
