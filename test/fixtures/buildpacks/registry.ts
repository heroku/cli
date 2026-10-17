import type {BuildpackBody, ReadmeBody, RevisionBody} from '@heroku/buildpack-registry'

export function buildpack(overrides: Partial<BuildpackBody> = {}): BuildpackBody {
  return {
    blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/ruby.tgz',
    category: 'languages',
    created_at: new Date('2020-01-01T00:00:00.000Z'),
    description: 'A test buildpack',
    id: 'buildpack-id',
    logo: {
      medium: {
        height: 64,
        url: 'https://example.com/logo-medium.png',
        width: 64,
      },
      small: {
        height: 32,
        url: 'https://example.com/logo-small.png',
        width: 32,
      },
    },
    name: 'ruby',
    namespace: 'heroku',
    source: {
      owner: 'heroku',
      repo: 'heroku-buildpack-ruby',
      type: 'github',
    },
    support: {
      address: null,
      method: 'unsupported',
    },
    two_factor_authentication: false,
    updated_at: new Date('2020-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

export function revision(overrides: Partial<RevisionBody> = {}): RevisionBody {
  return {
    buildpack_id: 'buildpack-id',
    checksum: 'checksum',
    created_at: new Date('2020-01-01T00:00:00.000Z'),
    id: 'revision-id',
    license: 'MIT',
    published_by_id: 'user-id',
    release: 1,
    status: 'published',
    updated_at: new Date('2020-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

export function readme(overrides: ReadmeBody = {}): ReadmeBody {
  return {...overrides}
}
