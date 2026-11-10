import type {BuildpackBody, ReadmeBody, RevisionBody} from '@heroku/buildpack-registry'

// Ported from @heroku/buildpack-registry <=1.0.x, which exported these test helpers.
export const Fixture = {
  buildpack(options: Partial<BuildpackBody> = {}): BuildpackBody {
    return {
      archived: false,
      blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/scala.tgz',
      category: 'languages',
      created_at: new Date(),
      description: 'Official Heroku Buildpack for Scala',
      id: '3ef8f543-b953-4a26-b410-8807d1b45eb1',
      logo: {
        medium: {
          height: 128,
          url: 'https://s3.amazonaws.com/buildpack-registry/images/buildpacks/logos/3ef/8f5/43-/medium/data?1526489067',
          width: 128,
        },
        small: {
          height: 64,
          url: 'https://s3.amazonaws.com/buildpack-registry/images/buildpacks/logos/3ef/8f5/43-/small/data?1526489067',
          width: 64,
        },
      },
      name: 'scala',
      namespace: 'heroku',
      source: {
        owner: 'heroku',
        repo: 'heroku-buildpack-scala',
        type: 'github',
      },
      support: {address: null, method: 'github'},
      two_factor_authentication: false,
      updated_at: new Date(),
      ...options,
    }
  },

  readme(options: Partial<ReadmeBody> = {}): ReadmeBody {
    return {
      content: Buffer.from([
        '# Heroku Exec Buildpack',
        '',
        'This is a [Heroku Buildpack](https://devcenter.heroku.com/articles/buildpacks)',
        'that works with the [Heroku Exec](https://devcenter.heroku.com/articles/heroku-exec) feature.',
        '',
      ].join('\n')).toString('base64'),
      encoding: 'base64',
      sha: 'a5e1e5f5eb76095087b32b31caf5ccaee0c2cae6',
      ...options,
    }
  },

  revision(options: Partial<RevisionBody> = {}): RevisionBody {
    return {
      buildpack_id: '71a3c00a-d6c7-4393-94c5-d5d71531720e',
      checksum: '3fc5aa90fcdc97b2a22a9bba1dac07323dd12d3d4e0abc1984fb06e6e15bc649',
      created_at: new Date(),
      id: '8de70dbe-e862-4d51-b906-123ef3bf2fc5',
      license: 'MIT',
      published_by_id: 'bebd5adc-2194-41c9-a246-d97af547a3f9',
      release: 151,
      status: 'published',
      tarball: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/scala-v151.tgz',
      updated_at: new Date(),
      ...options,
    }
  },
}
