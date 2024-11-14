/* eslint-disable mocha/no-setup-in-describe */
import {expect, test} from '@oclif/test'
import * as nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub'
nock.disableNetConnect()

const cedarApp = {
  acm: false,
  archived_at: null,
  build_stack: {name: 'heroku-24'},
  created_at: '2024-09-06T17:45:29Z',
  git_url: 'https://git.heroku.com',
  id: '12345678-aaaa-bbbb-cccc-b2443790f501',
  generation: 'cedar',
  maintenance: false,
  name: 'example',
  owner: {email: 'example-owner@heroku.com'},
  internal_routing: null,
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
  maintenance: false,
  name: 'example',
  owner: {email: 'example-owner@heroku.com'},
  internal_routing: null,
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
    artifacts: [
      {
        type: 'oci-image',
        id: '01234567-89ab-cdef-0123-456789abcdef',
      },
    ],
    app: {
      name: 'example',
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    created_at: '2012-01-01T12:00:00Z',
    description: 'Added new feature',
    id: '01234567-89ab-cdef-0123-456789abcdef',
    updated_at: '2012-01-01T12:00:00Z',
    oci_image: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    slug: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
    },
    status: 'succeeded',
    user: {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      email: 'username@example.com',
    },
    version: 11,
    current: true,
    output_stream_url: 'https://release-output.heroku.com/streams/01234567-89ab-cdef-0123-456789abcdef',
    eligible_for_rollback: true,
  },
]

const ociImages = [
  {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    base_image_name: 'heroku/heroku:22-cnb',
    base_top_layer: 'sha256:ea36ae5fbc1e7230e0a782bf216fb46500e210382703baa6bab8acf2c6a23f78',
    commit: '60883d9e8947a57e04dc9124f25df004866a2051',
    commit_description: 'fixed a bug with API documentation',
    image_repo: 'd7ba1ace-b396-4691-968c-37ae53153426/builds',
    digest: 'sha256:dc14ae5fbc1e7230e0a782bf216fb46500e210631703bcc6bab8acf2c6a23f42',
    stack: {
      id: 'ba46bf09-7bd1-42fd-90df-a1a9a93eb4a2',
      name: 'cnb',
    },
    process_types: {
      web: {
        name: 'web',
        display_cmd: 'bundle exec puma -p $PORT',
        command: '/cnb/process/web',
        working_dir: '/workspace/webapp',
        default: true,
      },
    },
    buildpacks: [
      {
        id: 'heroku/ruby',
        version: '2.0.0',
        homepage: 'https://github.com/heroku/buildpacks-ruby',
      },
    ],
    created_at: '2012-01-01T12:00:00Z',
    updated_at: '2012-01-01T12:00:00Z',
    architecture: 'arm64',
  },
]
describe('buildpacks', function () {
  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# displays the buildpack URL', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${cedarApp.name} Buildpack

https://github.com/heroku/heroku-buildpack-ruby
`)
    })

  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api, [{url: 'urn:buildpack:heroku/ruby', name: 'heroku/ruby'}])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# maps buildpack urns to names', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${cedarApp.name} Buildpack

heroku/ruby
`)
    })

  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz'])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# does not map buildpack s3 to names', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${cedarApp.name} Buildpack

https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz
`)
    })

  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api)
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# with no buildpack URL set does not display a buildpack URL', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `${cedarApp.name} has no Buildpack URL set.
`)
    })

  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# with two buildpack URLs set displays the buildpack URL', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${cedarApp.name} Buildpacks

1. https://github.com/heroku/heroku-buildpack-java
2. https://github.com/heroku/heroku-buildpack-ruby
`)
    })

  test
    .nock('https://api.heroku.com', (api: nock.Scope) => {
      api.get(`/apps/${cedarApp.name}`).reply(200, cedarApp)
      Stubber.get(api, [
        'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/java.tgz',
        'https://buildpack-registry.s3.amazonaws.com/buildpacks/rust-lang/rust.tgz',
      ])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# returns the buildpack registry name back', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${cedarApp.name} Buildpacks

1. heroku/java
2. rust-lang/rust
`)
    })

  test
    .nock('https://api.heroku.com', {
      reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}
    }, (api: nock.Scope) => {
      api.get(`/apps/${firApp.name}`).reply(200, firApp)
      api.get(`/apps/${firApp.name}/releases`).reply(200, releases)
      api.get(`/apps/${firApp.name}/oci-images/${releases[0].id}`).reply(200, ociImages)
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', cedarApp.name])
    .it('# returns cnb buildpack ids for fir apps', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== ⬢ ${firApp.name} Buildpack

heroku/ruby
`)
    })
})
