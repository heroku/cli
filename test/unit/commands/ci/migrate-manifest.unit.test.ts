import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {promises as fs} from 'node:fs'
const {readFile, unlink, writeFile} = fs
const unlinkFile = unlink

describe('ci:migrate-manifest', function () {
  let appJsonFileContents
  const appJsonPath = './app.json'

  afterEach(async function () {
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
    addons: [
      'openredis',
      {
        as: 'MONGO',
        plan: 'mongolab:shared-single-small',
      },
      {
        options: {
          version: '9.5',
        },
        plan: 'heroku-postgresql',
      },
    ],
    buildpacks: [
      {
        url: 'https://github.com/stomita/heroku-buildpack-phantomjs',
      },
    ],
    description: 'This app does one little thing, and does it well.',
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
    environments: {
      test: {
        scripts: {
          test: 'bundle exec rake test',
        },
      },
    },
    formation: {
      web: {
        quantity: 1,
        size: 'standard-1x',
      },
    },
    image: 'heroku/ruby',
    keywords: [
      'productivity',
      'HTML5',
      'scalpel',
    ],
    logo: 'https://small-sharp-tool.com/logo.svg',
    name: 'Small Sharp Tool',
    repository: 'https://github.com/jane-doe/small-sharp-tool',
    scripts: {
      postdeploy: 'bundle exec rake bootstrap',
    },
    success_url: '/welcome',
    website: 'https://small-sharp-tool.com/',
  }

  const mockConvertedAppJSONFileContents = {
    environments: {
      test: {
        addons: [
          'openredis',
          {
            as: 'MONGO',
            plan: 'mongolab:shared-single-small',
          },
          {
            options: {
              version: '9.5',
            },
            plan: 'heroku-postgresql',
          },
        ],
        buildpacks: [
          {
            url: 'https://github.com/stomita/heroku-buildpack-phantomjs',
          },
        ],
        description: 'This app does one little thing, and does it well.',
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
        environments: {
          test: {
            scripts: {
              test: 'bundle exec rake test',
            },
          },
        },
        formation: {
          web: {
            quantity: 1,
            size: 'standard-1x',
          },
        },
        image: 'heroku/ruby',
        keywords: [
          'productivity',
          'HTML5',
          'scalpel',
        ],
        logo: 'https://small-sharp-tool.com/logo.svg',
        name: 'Small Sharp Tool',
        repository: 'https://github.com/jane-doe/small-sharp-tool',
        scripts: {
          postdeploy: 'bundle exec rake bootstrap',
        },
        success_url: '/welcome',
        website: 'https://small-sharp-tool.com/',
      },
    },
  }

  it('creates an app.json file if none exists', async function () {
    const {stdout} = await runCommand(['ci:migrate-manifest'])

    const fileContents = await readFile(`${process.cwd()}/app.json`, 'utf8')
    appJsonFileContents = JSON.parse(fileContents)

    expect(stdout).to.equal('We couldn\'t find an app-ci.json file in the current directory, but we\'re creating a new app.json manifest for you.\nPlease check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
    expect(appJsonFileContents).to.deep.equal(mockNewAppJsonFileContents)
  })

  it('creates converted app.json file when app-ci.json file is present', async function () {
    await writeFile('app-ci.json', `${JSON.stringify(mockOldAppCiJsonFileContents, null, '  ')}\n`)

    const {stdout} = await runCommand(['ci:migrate-manifest'])

    const fileContents = await readFile(`${process.cwd()}/app.json`, 'utf8')
    appJsonFileContents = JSON.parse(fileContents)

    expect(stdout).to.equal('Please check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
    expect(appJsonFileContents).to.deep.equal(mockConvertedAppJSONFileContents)
  })
})
