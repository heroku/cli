import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/certs/index.js'
import nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import tsheredoc from 'tsheredoc'
import runCommand from '../../../helpers/runCommand.js'
import {
  endpointStables,
  endpointWildcard,
  endpointWildcardBug,
  endpointAcm,
} from '../../../helpers/stubs/sni-endpoints.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {expect} from 'chai'

const heredoc = tsheredoc.default

describe('heroku certs', function () {
  it('warns about no SSL certificates if the app has no certs', async function () {
    nock('https://api.heroku.com')
    await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr.output, '')
    expectOutput(stdout.output, heredoc(`
      ⬢ example has no SSL certificates.
      Use heroku certs:add CRT KEY to add one.
    `))
  })

  it('# shows ACM for the type when acm true', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointAcm])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type')
    const expected = removeAllWhitespace(' tokyo-1050 heroku.com     2013-08-01 21:34 UTC True    ACM')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s)                                    Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches (bugfix)', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcardBug])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 fooexample.org 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches wildcard', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {Accept: 'application/vnd.heroku+json; version=3'},
    })
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointWildcard])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 *.example.org  2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and just stable cname matches', async function () {
    nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpointStables])
    await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr.output, '')
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s)                                    Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })
})
