import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'

const cedarApp = {
  acm: false,
  archived_at: null,
  build_stack: {name: 'heroku-24'},
  created_at: '2024-09-06T17:45:29Z',
  generation: 'cedar',
  git_url: 'https://git.heroku.com',
  id: '12345678-aaaa-bbbb-cccc-b2443790f501',
  internal_routing: null,
  maintenance: false,
  name: 'example',
  owner: {email: 'example-owner@heroku.com'},
  region: {name: 'virginia'},
  released_at: '2024-11-13T20:07:47Z',
  repo_size: null,
  slug_size: null,
  stack: {name: 'heroku-24'},
  updated_at: '2024-11-13T20:07:47Z',
  web_url: 'https://cedar-example-app.herokuapp.com',
}

const firApp = {
  acm: false,
  archived_at: null,
  build_stack: {name: 'heroku-24'},
  created_at: '2024-09-06T17:45:29Z',
  generation: 'fir',
  git_url: 'https://git.heroku.com',
  id: '12345678-aaaa-bbbb-cccc-b2443790f501',
  internal_routing: null,
  maintenance: false,
  name: 'example',
  owner: {email: 'example-owner@heroku.com'},
  region: {name: 'virginia'},
  released_at: '2024-11-13T20:07:47Z',
  repo_size: null,
  slug_size: null,
  stack: {name: 'heroku-24'},
  updated_at: '2024-11-13T20:07:47Z',
  web_url: 'https://fir-example-app.herokuapp.com',
}

const releases = [
  {
    addon_plan_names: [
      'heroku-postgresql:dev',
    ],
    app: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'example',
    },
    artifacts: [
      {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        type: 'oci-image',
      },
    ],
    created_at: '2012-01-01T12:00:00Z',
    current: true,
    description: 'Added new feature',
    eligible_for_rollback: true,
    id: '01234567-89ab-cdef-0123-456789abcdef',
    oci_image: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    output_stream_url: 'https://release-output.heroku.com/streams/01234567-89ab-cdef-0123-456789abcdef',
    slug: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    status: 'succeeded',
    updated_at: '2012-01-01T12:00:00Z',
    user: {
      email: 'username@example.com',
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    version: 11,
  },
]

const ociImages = [
  {
    architecture: 'arm64',
    base_image_name: 'heroku/heroku:22-cnb',
    base_top_layer: 'sha256:ea36ae5fbc1e7230e0a782bf216fb46500e210382703baa6bab8acf2c6a23f78',
    buildpacks: [
      {
        homepage: 'https://github.com/heroku/buildpacks-ruby',
        id: 'heroku/ruby',
        version: '2.0.0',
      },
    ],
    commit: '60883d9e8947a57e04dc9124f25df004866a2051',
    commit_description: 'fixed a bug with API documentation',
    created_at: '2012-01-01T12:00:00Z',
    digest: 'sha256:dc14ae5fbc1e7230e0a782bf216fb46500e210631703bcc6bab8acf2c6a23f42',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    image_repo: 'd7ba1ace-b396-4691-968c-37ae53153426/builds',
    process_types: {
      web: {
        command: '/cnb/process/web',
        default: true,
        display_cmd: 'bundle exec puma -p $PORT',
        name: 'web',
        working_dir: '/workspace/webapp',
      },
    },
    stack: {
      id: 'ba46bf09-7bd1-42fd-90df-a1a9a93eb4a2',
      name: 'cnb',
    },
    updated_at: '2012-01-01T12:00:00Z',
  },
]

describe('buildpacks', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('# displays the buildpack URL', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      === ⬢ ${cedarApp.name} Classic Buildpack (from the Heroku Buildpack Registry)

      https://github.com/heroku/heroku-buildpack-ruby
    `))
  })

  it('# maps buildpack urns to names', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, [{name: 'heroku/ruby', url: 'urn:buildpack:heroku/ruby'}])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      === ⬢ ${cedarApp.name} Classic Buildpack (from the Heroku Buildpack Registry)

      heroku/ruby
    `))
  })

  it('# does not map buildpack s3 to names', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz'])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      === ⬢ ${cedarApp.name} Classic Buildpack (from the Heroku Buildpack Registry)

      https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz
    `))
  })

  it('# with no buildpack URL set does not display a buildpack URL', async function () {
    const api = nock('https://api.heroku.com')
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api)

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      ⬢ ${cedarApp.name} has no Buildpacks.
    `))
  })

  it('# with two buildpack URLs set displays the buildpack URL', async function () {
    const api = nock('https://api.heroku.com')
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, [
      'https://github.com/heroku/heroku-buildpack-java',
      'https://github.com/heroku/heroku-buildpack-ruby',
    ])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      === ⬢ ${cedarApp.name} Classic Buildpacks (from the Heroku Buildpack Registry)

      1. https://github.com/heroku/heroku-buildpack-java
      2. https://github.com/heroku/heroku-buildpack-ruby
    `))
  })

  it('# returns the buildpack registry name back', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, [
      'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/java.tgz',
      'https://buildpack-registry.s3.amazonaws.com/buildpacks/rust-lang/rust.tgz',
    ])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
      === ⬢ ${cedarApp.name} Classic Buildpacks (from the Heroku Buildpack Registry)

      1. heroku/java
      2. rust-lang/rust
    `))
  })

  it('# displays the buildpack URL with classic buildpack source', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
    === ⬢ ${cedarApp.name} Classic Buildpack (from the Heroku Buildpack Registry)

    https://github.com/heroku/heroku-buildpack-ruby
  `))
  })

  it('# returns cnb buildpack ids for fir apps with OCI source', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'},
    })
      .get(`/apps/${firApp.name}`).reply(200, firApp)
      .get(`/apps/${firApp.name}/releases`).reply(200, releases)
      .get(`/apps/${firApp.name}/oci-images/${releases[0].id}`).reply(200, ociImages)

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', firApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
    === ⬢ ${firApp.name} Cloud Native Buildpack (from the latest release's OCI image)

    heroku/ruby
  `))
  })

  it('# with multiple buildpack URLs shows plural form and source', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api, [
      'https://github.com/heroku/heroku-buildpack-java',
      'https://github.com/heroku/heroku-buildpack-ruby',
    ])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(heredoc(`
    === ⬢ ${cedarApp.name} Classic Buildpacks (from the Heroku Buildpack Registry)

    1. https://github.com/heroku/heroku-buildpack-java
    2. https://github.com/heroku/heroku-buildpack-ruby
  `))
  })

  it('# with no buildpack URL set shows appropriate message', async function () {
    api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
    Stubber.get(api)

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', cedarApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`⬢ ${cedarApp.name} has no Buildpacks.\n`)
  })

  it('# returns nothing when no releases for fir app', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'},
    })
      .get(`/apps/${firApp.name}`).reply(200, firApp)
      .get(`/apps/${firApp.name}/releases`).reply(200, [])

    const {stderr, stdout} = await runCommand(['buildpacks', '-a', firApp.name])

    expect(stderr).to.equal('')
    expect(stdout).to.equal(`⬢ ${firApp.name} has no Buildpacks.\n`)
  })
})
