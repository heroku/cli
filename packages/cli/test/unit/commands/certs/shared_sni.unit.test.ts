import {stdout, stderr} from 'stdout-stderr'
import runCommand, {GenericCmd} from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {
  Endpoint,
  endpoint,
  endpoint2,
  endpointCname,
  endpointHeroku,
  certificateDetails,
} from '../../../helpers/stubs/sni-endpoints'

export const shouldHandleArgs = function (commandText: string, command: GenericCmd, callback: (err: Error | null, path: string, endpoint: Endpoint) => nock.Scope, options: {stderr:CallableFunction, stdout:CallableFunction}) {
  const stdoutOutput = options.stdout || function () {
    return ''
  }

  const stderrOutput = options.stderr || function () {
    return ''
  }

  describe(`${commandText}`, function () {
    beforeEach(function () {
      nock.cleanAll()
    })

    it('allows an --endpoint to be specified using --name', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint])
      callback(null, '/apps/example/sni-endpoints/tokyo-1050', endpoint)
      await runCommand(command, [
        '--app',
        'example',
        '--name',
        'tokyo-1050',
      ])
      expect(stderr.output).to.contain(stderrOutput(endpoint))
      expect(stdout.output).to.eq(stdoutOutput(certificateDetails, endpoint))
    })

    it('# errors out for --endpoint when there are multiple ', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint, endpointCname])
      await runCommand(command, [
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ]).catch(function (error: Error) {
        expect(error.message).to.equal('Must pass --name when more than one endpoint matches --endpoint')
      })
    })

    it('# allows an endpoint to be specified using --endpoint', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint])
      callback(null, '/apps/example/sni-endpoints/tokyo-1050', endpoint)
      await runCommand(command, [
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ])
      expect(stderr.output).to.contain(stderrOutput(endpoint))
      expect(stdout.output).to.eq(stdoutOutput(certificateDetails, endpoint))
    })

    it('# --endpoint errors out if there is no match', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint2])
      await runCommand(command, [
        '--app',
        'example',
        '--endpoint',
        'tokyo-1050.herokussl.com',
      ]).catch(function (error: Error) {
        expect(error.message).to.equal('Record not found.')
      })
    })

    it('# --name errors out in the case where more than one matches', async function () {
      nock('https://api.heroku.com')
        .get('/apps/example/sni-endpoints')
        .reply(200, [endpoint, endpointHeroku])
      await runCommand(command, [
        '--app',
        'example',
        '--name',
        'tokyo-1050',
      ]).catch(function (error: Error) {
        expect(error.message).to.equal('More than one endpoint matches tokyo-1050, please file a support ticket')
      })
    })
  })
}
