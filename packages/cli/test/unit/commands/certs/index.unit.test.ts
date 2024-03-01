import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/certs/index'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import runCommand from '../../../helpers/runCommand'
import {
  endpointStables,
  endpointWildcard,
  endpointWildcardBug,
  endpointAcm,
} from '../../../helpers/stubs/sni-endpoints'

describe('heroku certs', function () {
  it('warns about no SSL certificates if the app has no certs', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [])
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
      example has no SSL certificates.
      Use heroku certs:add CRT KEY to add one.
    `))
  })

  it('# shows ACM for the type when acm true', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointAcm()])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    expectOutput(heredoc(stdout.output), heredoc(`
      Name       Common Name(s) Expires              Trusted Type
      ────────── ────────────── ──────────────────── ─────── ────
      tokyo-1050 heroku.com     2013-08-01 21:34 UTC True    ACM
    `))
  })

  it('# shows certs with common names stacked and stable matches', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables()])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    expectOutput(heredoc(stdout.output), heredoc(`
      Name       Common Name(s)                                    Expires              Trusted Type Domains
      ────────── ───────────────────────────────────────────────── ──────────────────── ─────── ──── ───────
      tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0
    `))
  })

  it('# shows certs with common names stacked and stable matches (bugfix)', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcardBug()])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    expectOutput(heredoc(stdout.output), heredoc(`
      Name       Common Name(s) Expires              Trusted Type Domains
      ────────── ────────────── ──────────────────── ─────── ──── ───────
      tokyo-1050 fooexample.org 2013-08-01 21:34 UTC False   SNI  0
    `))
  })

  it('# shows certs with common names stacked and stable matches wildcard', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcard()])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    expectOutput(heredoc(stdout.output), heredoc(`
      Name       Common Name(s) Expires              Trusted Type Domains
      ────────── ────────────── ──────────────────── ─────── ──── ───────
      tokyo-1050 *.example.org  2013-08-01 21:34 UTC False   SNI  0
    `))
  })
  it('# shows certs with common names stacked and just stable cname matches', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables()])
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, '')
    expectOutput(heredoc(stdout.output), heredoc(`
      Name       Common Name(s)                                    Expires              Trusted Type Domains
      ────────── ───────────────────────────────────────────────── ──────────────────── ─────── ──── ───────
      tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0
    `))
  })
})
