import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'

const isTTY = process.stdout.isTTY

const assertLineWidths = function (blob: string, lineWidth: number) {
  const lines = blob.split('\n')
  for (let i = 1; i < lines.length - 1; i++) {
    expect(lines[i].length).to.be.lessThan(lineWidth + 1)
  }
}

/*
describe('releases', function () {
  before(function () {
    process.env.TZ = 'UTC' // Use UTC time always
  })

  afterEach(function () {
    process.stdout.isTTY = isTTY
  })

  const releases = [
    {
      created_at: '2015-11-18T01:36:38Z', description: 'third commit', status: 'pending', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 41, current: false,
    }, {
      created_at: '2015-11-18T01:37:41Z', description: 'Set foo config vars', status: 'succeeded', id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'Remove AWS_SECRET_ACCESS_KEY config vars', status: 'failed', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 39, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'second commit', status: 'pending', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 38, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'first commit', status: null, id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 37, current: true,
    },
  ]

  const onlySuccessfulReleases = [
    {
      created_at: '2015-11-18T01:36:38Z', description: 'third commit', status: 'succeeded', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 41, current: false,
    }, {
      created_at: '2015-11-18T01:37:41Z', description: 'Set foo config vars', status: 'succeeded', id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'Remove AWS_SECRET_ACCESS_KEY config vars', status: 'succeeded', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 39, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'second commit', status: 'succeeded', id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 38, current: false,
    }, {
      created_at: '2015-11-18T01:36:38Z', description: 'first commit', status: null, id: '7be47426-2c1b-4e4d-b6e5-77c79169aa41', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 37, current: true,
    },
  ]
  const releasesNoSlug = [
    {
      created_at: '2015-11-18T01:36:38Z', description: 'first commit', status: 'pending', id: '86b20c9f-f5de-4876-aa36-d3dcb1d60f6a', slug: null, updated_at: '2015-11-18T01:36:38Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 1, current: false,
    },
  ]
  const extended = [
    {
      created_at: '2015-11-18T01:37:41Z', description: 'Set foo config vars', status: 'succeeded', id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', slug: {
        id: '37994c83-39a3-4cbf-b318-8f9dc648f701',
      }, updated_at: '2015-11-18T01:37:41Z', user: {
        email: 'rdagg@heroku.com', id: '5985f8c9-a63f-42a2-bec7-40b875bb986f',
      }, version: 40, extended: {
        slug_id: 1, slug_uuid: 'uuid',
      },
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 th… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars           rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remov… release command failed rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 se… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 third commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars           rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remove AWS_SECRET_ACCESS_KEY… rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 second commit                 rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 third commit release command executing            rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars                               rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remove AWS_SECRET_ACCESS_… release command failed rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 second commit release command executing           rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                                      rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 100)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 third commit                             rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars                      rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remove AWS_SECRET_ACCESS_KEY config vars rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 second commit                            rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                             rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 89)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 th… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars           rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remov… release command failed rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 se… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases - Current: v37

 v41 th… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars           rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remov… release command failed rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 se… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases

 v1 fi… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
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
    expect(stderr.output).to.equal('')
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
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases

 v40 Set foo config vars rdagg@heroku.com 2015/11/18 01:37:41 +0000 1       uuid
`)
    expect(stderr.output).to.equal('')
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

    expect(stdout.output).to.equal(`=== myapp Releases

 v40 Set foo config vars rdagg@heroku.com 2015/11/18 01:37:41 +0000 1       uuid
`)
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('shows no current release', async function () {
    process.stdout.isTTY = true
    process.stdout.columns = 80
    releases[releases.length - 1].current = false
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, releases)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(`=== myapp Releases

 v41 th… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v40 Set foo config vars           rdagg@heroku.com 2015/11/18 01:37:41 +0000
 v39 Remov… release command failed rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v38 se… release command executing rdagg@heroku.com 2015/11/18 01:36:38 +0000
 v37 first commit                  rdagg@heroku.com 2015/11/18 01:36:38 +0000
`)
    assertLineWidths(stdout.output, 80)
    expect(stderr.output).to.equal('')
    api.done()
  })
})

*/
