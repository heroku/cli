import {expect} from 'chai'
import * as sinon from 'sinon'
import * as DockerHelper from '../../../../src/lib/container/docker_helper'

const sandbox = sinon.createSandbox()

describe('DockerHelper', () => {
  afterEach(() => sandbox.restore())

  describe('.version', () => {
    it('returns a the major and minor version', async function () {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('18.02.0-ce-rc2')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([18, 2])
    })

    it('has an error', async () => {
      sandbox.stub(DockerHelper, 'cmd')
        .withArgs('docker', ['version', '-f', '{{.Client.Version}}'], {output: true})
        .resolves('an error occured')

      const version = await DockerHelper.version()

      expect(version).to.deep.equal([0, 0])
    })
  })
})
