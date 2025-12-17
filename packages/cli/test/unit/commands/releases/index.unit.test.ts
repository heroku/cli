import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/releases/index.js'
import runCommand from '../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('releases', function () {
  let originalColumns: number | undefined
  let originalIsTTY: boolean | undefined

  before(function () {
    process.env.TZ = 'UTC' // Use UTC time always
  })

  beforeEach(function () {
    originalColumns = process.stdout.columns
    originalIsTTY = process.stdout.isTTY
  })

  afterEach(function () {
    // Restore original values, handling undefined case
    if (originalIsTTY === undefined) {
      delete (process.stdout as {isTTY?: boolean}).isTTY
    } else {
      process.stdout.isTTY = originalIsTTY
    }

    if (originalColumns === undefined) {
      delete (process.stdout as {columns?: number}).columns
    } else {
      process.stdout.columns = originalColumns
    }
  })

  const releases = [
    {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'third commit', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'pending', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 41,
    }, {
      created_at: '2015-11-18T01:37:41Z', current: false, description: 'Set foo config vars', id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'Remove AWS_SECRET_ACCESS_KEY config vars', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'failed', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 39,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'second commit', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'pending', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 38,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: true, description: 'first commit', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: null, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 37,
    },
  ]

  const onlySuccessfulReleases = [
    {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'third commit', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 41,
    }, {
      created_at: '2015-11-18T01:37:41Z', current: false, description: 'Set foo config vars', id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'Remove AWS_SECRET_ACCESS_KEY config vars', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 39,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'second commit', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 38,
    }, {
      created_at: '2015-11-18T01:36:38Z', current: true, description: 'first commit', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: null, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 37,
    },
  ]
  const releasesNoSlug = [
    {
      created_at: '2015-11-18T01:36:38Z', current: false, description: 'first commit', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: null, status: 'pending', updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 1,
    },
  ]
  const extended = [
    {
      created_at: '2015-11-18T01:37:41Z', description: 'Set foo config vars', extended: {
        slug_id: 1, slug_uuid: 'uuid',
      }, id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, status: 'succeeded', updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40,
    },
  ]

  it('shows releases', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v     description   user               created_at'))
    expect(actual).to.include(removeAllWhitespace('v41'))
    expect(actual).to.include(removeAllWhitespace('th… release…'))
    expect(actual).to.include(removeAllWhitespace('v40   Set foo co…   rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v37   first comm…   rdagg@heroku.com'))
    api.done()
  })

  it('shows successful releases', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, onlySuccessfulReleases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v     description   user               created_at'))
    expect(actual).to.include(removeAllWhitespace('v41   third comm…   rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v40   Set foo co…   rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v37   first comm…   rdagg@heroku.com'))
    api.done()
  })

  it('shows releases in wider terminal', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 100
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v     description             user               created_at'))
    // cspell:ignore releas
    expect(actual).to.include(removeAllWhitespace('v41'))
    expect(actual).to.include(removeAllWhitespace('third commit releas…'))
    expect(actual).to.include(removeAllWhitespace('v40   Set foo config vars     rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v37   first commit            rdagg@heroku.com'))
    api.done()
  })

  it('shows successful releases in wider terminal', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 100
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, onlySuccessfulReleases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v     description             user               created_at'))
    expect(actual).to.include(removeAllWhitespace('v41   third commit            rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v40   Set foo config vars     rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('v37   first commit            rdagg@heroku.com'))
    api.done()
  })

  it('shows releases in narrow terminal', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 65
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('v41'))
    expect(actual).to.include(removeAllWhitespace('v40'))
    expect(actual).to.include(removeAllWhitespace('v37'))
    expect(actual).to.include(removeAllWhitespace('rdagg'))
    api.done()
  })

  it('shows pending releases without release phase', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases - Current: v37'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('v41'))
    expect(actual).to.include(removeAllWhitespace('v40'))
    expect(actual).to.include(removeAllWhitespace('v37'))
    expect(actual).to.include(removeAllWhitespace('rdagg@heroku.com'))
    api.done()
  })

  it('shows pending releases without a slug', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releasesNoSlug)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('v1'))
    expect(actual).to.include(removeAllWhitespace('rdagg@heroku.com'))
    api.done()
  })

  it('shows releases as json', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--json',
    ])

    expect(JSON.parse(stdout.output)[0]).to.have.nested.include({version: 41})
    // stderr may contain warnings from other plugins in test environment
    api.done()
  })

  it('shows message if no releases', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal('myapp has no releases.\n')
    // stderr may contain warnings from other plugins in test environment
    api.done()
  })

  it('shows extended info', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases?extended=true')
      .reply(200, extended)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('slug_id'))
    expect(actual).to.include(removeAllWhitespace('slug_uuid'))
    expect(actual).to.include(removeAllWhitespace('v40'))
    expect(actual).to.include(removeAllWhitespace('rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('1'))
    expect(actual).to.include(removeAllWhitespace('uuid'))
    // stderr may contain warnings from other plugins in test environment
    api.done()
  })

  it('shows extended info in wider terminal', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 100
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases?extended=true')
      .reply(200, extended)

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('slug_id'))
    expect(actual).to.include(removeAllWhitespace('slug_uuid'))
    expect(actual).to.include(removeAllWhitespace('v40'))
    expect(actual).to.include(removeAllWhitespace('Set foo config vars'))
    expect(actual).to.include(removeAllWhitespace('rdagg@heroku.com'))
    expect(actual).to.include(removeAllWhitespace('1'))
    expect(actual).to.include(removeAllWhitespace('uuid'))
    // stderr may contain warnings from other plugins in test environment
    api.done()
  })

  it('shows no current release', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    // Create a copy to avoid mutating the shared releases array
    const releasesCopy = releases.map(r => ({...r}))
    releasesCopy.at(-1)!.current = false
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releasesCopy)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    const actual = removeAllWhitespace(stdout.output)
    expect(actual).to.include(removeAllWhitespace('=== myapp Releases'))
    expect(actual).to.include(removeAllWhitespace('v'))
    expect(actual).to.include(removeAllWhitespace('description'))
    expect(actual).to.include(removeAllWhitespace('v41'))
    expect(actual).to.include(removeAllWhitespace('v40'))
    expect(actual).to.include(removeAllWhitespace('v37'))
    expect(actual).to.include(removeAllWhitespace('rdagg@heroku.com'))
    api.done()
  })
})
