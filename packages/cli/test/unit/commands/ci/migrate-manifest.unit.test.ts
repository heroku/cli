import {expect, test} from '@oclif/test'
const {readFile, writeFile, unlink} = fs
const unlinkFile = unlink

/*
describe('ci:migrate-manifest', function () {
  let appJsonFileContents
  const appJsonPath = './app.json'

  afterEach(async () => {
    // Clean up any files created during tests
    try {
      await unlinkFile(appJsonPath)
    } catch {}

    try {
      await unlinkFile('./app-ci.json')
    } catch {}
  })
  const mockNewAppJsonFileContents = {environments: {}}
  const mockOldAppCiJsonFileContents = {
    name: 'Small Sharp Tool',
    description: 'This app does one little thing, and does it well.',
    keywords: [
      'productivity',
      'HTML5',
      'scalpel',
    ],
    website: 'https://small-sharp-tool.com/',
    repository: 'https://github.com/jane-doe/small-sharp-tool',
    logo: 'https://small-sharp-tool.com/logo.svg',
    success_url: '/welcome',
    scripts: {
      postdeploy: 'bundle exec rake bootstrap',
    },
    env: {
      SECRET_TOKEN: {
        description: 'A secret key for verifying the integrity of signed cookies.',
        generator: 'secret',
      },
      WEB_CONCURRENCY: {
        description: 'The number of processes to run.',
        value: '5',
      },
    },
    formation: {
      web: {
        quantity: 1,
        size: 'standard-1x',
      },
    },
    image: 'heroku/ruby',
    addons: [
      'openredis',
      {
        plan: 'mongolab:shared-single-small',
        as: 'MONGO',
      },
      {
        plan: 'heroku-postgresql',
        options: {
          version: '9.5',
        },
      },
    ],
    buildpacks: [
      {
        url: 'https://github.com/stomita/heroku-buildpack-phantomjs',
      },
    ],
    environments: {
      test: {
        scripts: {
          test: 'bundle exec rake test',
        },
      },
    },
  }

  const mockConvertedAppJSONFileContents = {
    environments: {
      test: {
        name: 'Small Sharp Tool',
        description: 'This app does one little thing, and does it well.',
        keywords: [
          'productivity',
          'HTML5',
          'scalpel',
        ],
        website: 'https://small-sharp-tool.com/',
        repository: 'https://github.com/jane-doe/small-sharp-tool',
        logo: 'https://small-sharp-tool.com/logo.svg',
        success_url: '/welcome',
        scripts: {
          postdeploy: 'bundle exec rake bootstrap',
        },
        env: {
          SECRET_TOKEN: {
            description: 'A secret key for verifying the integrity of signed cookies.',
            generator: 'secret',
          },
          WEB_CONCURRENCY: {
            description: 'The number of processes to run.',
            value: '5',
          },
        },
        formation: {
          web: {
            quantity: 1,
            size: 'standard-1x',
          },
        },
        image: 'heroku/ruby',
        addons: [
          'openredis',
          {
            plan: 'mongolab:shared-single-small',
            as: 'MONGO',
          },
          {
            plan: 'heroku-postgresql',
            options: {
              version: '9.5',
            },
          },
        ],
        buildpacks: [
          {
            url: 'https://github.com/stomita/heroku-buildpack-phantomjs',
          },
        ],
        environments: {
          test: {
            scripts: {
              test: 'bundle exec rake test',
            },
          },
        },
      },
    },
  }

  test
    .stdout()
    .command(['ci:migrate-manifest'])
    .it('creates an app.json file if none exists', async ({stdout}) => {
      const fileContents = await readFile(`${process.cwd()}/app.json`, 'utf8')
      appJsonFileContents = JSON.parse(fileContents)

      expect(stdout).to.equal('We couldn\'t find an app-ci.json file in the current directory, but we\'re creating a new app.json manifest for you.\nPlease check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
      expect(appJsonFileContents).to.deep.equal(mockNewAppJsonFileContents)
    })

  test
    .stdout()
    .do(async () => {
      await writeFile('app-ci.json', `${JSON.stringify(mockOldAppCiJsonFileContents, null, '  ')}\n`)
    })
    .command(['ci:migrate-manifest'])
    .it('creates converted app.json file when app-ci.json file is present', async ({stdout}) => {
      const fileContents = await readFile(`${process.cwd()}/app.json`, 'utf8')
      appJsonFileContents = JSON.parse(fileContents)

      expect(stdout).to.equal('Please check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
      expect(appJsonFileContents).to.deep.equal(mockConvertedAppJSONFileContents)
    })
})

*/
