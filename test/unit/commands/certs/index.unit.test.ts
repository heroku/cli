import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import * as sinon from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/index.js'
import {sniEndpointList} from '../../../fixtures/certs/fixtures.js'
import {expectJsonSnapshot} from '../../../helpers/json-snapshot.js'
import {
  endpointAcm,
  endpointStables,
  endpointWildcard,
  endpointWildcardBug,
} from '../../../helpers/stubs/sni-endpoints.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc

type FakePlatform = {
  sniEndpoint: {list: sinon.SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    sniEndpoint: {list: sinon.stub()},
  }
}

describe('heroku certs', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    sinon.stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    sinon.restore()
  })

  it('warns about no SSL certificates if the app has no certs', async function () {
    fakePlatform.sniEndpoint.list.resolves([])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])
    expectOutput(stderr, '')
    expectOutput(stdout, heredoc(`
      ⬢ example has no SSL certificates.
      Use heroku certs:add CRT KEY to add one.
    `))
    expect(fakePlatform.sniEndpoint.list.calledOnceWithExactly('example')).to.equal(true)
  })

  it('# shows ACM for the type when acm true', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointAcm])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr, '')
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type')
    const expected = removeAllWhitespace(' tokyo-1050 heroku.com     2013-08-01 21:34 UTC True    ACM')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointStables])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr, '')
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s)                                    Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches (bugfix)', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointWildcardBug])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr, '')
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 fooexample.org 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and stable matches wildcard', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointWildcard])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr, '')
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s) Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 *.example.org  2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  it('# shows certs with common names stacked and just stable cname matches', async function () {
    fakePlatform.sniEndpoint.list.resolves([endpointStables])
    const {stderr, stdout} = await runCommand(Cmd, ['--app', 'example'])

    expectOutput(stderr, '')
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace('Name       Common Name(s)                                    Expires              Trusted Type Domains')
    const expected = removeAllWhitespace(' tokyo-1050 foo.example.org, bar.example.org, biz.example.com 2013-08-01 21:34 UTC False   SNI  0')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expected)
  })

  describe('--json', function () {
    it('returns the SDK certificate list in API order', async function () {
      fakePlatform.sniEndpoint.list.resolves(sniEndpointList)

      const {json} = await expectJsonSnapshot<{name: string}[]>(this, Cmd, ['--app', 'example'])

      expect(json.map(cert => cert.name)).to.deep.equal(['tokyo-1050', 'akita-7777'])
    })

    it('returns an empty list without the empty-state message', async function () {
      fakePlatform.sniEndpoint.list.resolves([])

      await expectJsonSnapshot(this, Cmd, ['--app', 'example'])
    })
  })
})
