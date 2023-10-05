/* eslint-disable quote-props */
import {expect, test} from '@oclif/test'
import * as fs from 'async-file'
import * as _ from 'lodash'
const BB = require('bluebird')
const writeFile = BB.promisify(fs.writeFile)
const unlinkFile = BB.promisify(fs.unlink)

describe('ci:migrate-manifest', async () => {
  let appJsonFileContents
  const appJSONPath = './app.json'
  const mockNewAppJSONFileContents = {environments: {}}
  const mockOldAppCiJSONFileContents = {
    'name': 'Small Sharp Tool',
    'description': 'This app does one little thing, and does it well.',
    'keywords': [
      'productivity',
      'HTML5',
      'scalpel',
    ],
    'website': 'https://small-sharp-tool.com/',
    'repository': 'https://github.com/jane-doe/small-sharp-tool',
    'logo': 'https://small-sharp-tool.com/logo.svg',
    'success_url': '/welcome',
    'scripts': {
      'postdeploy': 'bundle exec rake bootstrap',
    },
    'env': {
      'SECRET_TOKEN': {
        'description': 'A secret key for verifying the integrity of signed cookies.',
        'generator': 'secret',
      },
      'WEB_CONCURRENCY': {
        'description': 'The number of processes to run.',
        'value': '5',
      },
    },
    'formation': {
      'web': {
        'quantity': 1,
        'size': 'standard-1x',
      },
    },
    'image': 'heroku/ruby',
    'addons': [
      'openredis',
      {
        'plan': 'mongolab:shared-single-small',
        'as': 'MONGO',
      },
      {
        'plan': 'heroku-postgresql',
        'options': {
          'version': '9.5',
        },
      },
    ],
    'buildpacks': [
      {
        'url': 'https://github.com/stomita/heroku-buildpack-phantomjs',
      },
    ],
    'environments': {
      'test': {
        'scripts': {
          'test': 'bundle exec rake test',
        },
      },
    },
  }

  const mockConvertedAppJSONFileContents {
    
  }

  test
    .stdout({print: true})
    .command(['ci:migrate-manifest'])
    .it('creates an app.json file if none exists', async ({stdout}) => {
      appJsonFileContents = require(`${process.cwd()}/app.json`)
      const areJSONObjectsEqual = _.isEqual(appJsonFileContents, mockNewAppJSONFileContents)
      expect(stdout).to.equal('We couldn\'t find an app-ci.json file in the current directory, but we\'re creating a new app.json manifest for you.\nPlease check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
      expect(areJSONObjectsEqual).to.equal(true)
      unlinkFile(appJSONPath)
    })

  test
    .stdout({print: true})
    .do(() => {
      writeFile(appJSONPath, `${JSON.stringify(mockOldAppCiJSONFileContents, null, '  ')}\n`)
    })
    .command(['ci:migrate-manifest'])
    .it('creates converted app.json file when app-ci.json file is present', async ({stdout}) => {
      appJsonFileContents = require(`${process.cwd()}/app.json`)
      const areJSONObjectsEqual = _.isEqual(appJsonFileContents, mockNewAppJSONFileContents)
      expect(stdout).to.equal('We couldn\'t find an app-ci.json file in the current directory, but we\'re creating a new app.json manifest for you.\nPlease check the contents of your app.json before committing to your repo.\nYou\'re all set! 🎉\n')
      expect(areJSONObjectsEqual).to.equal(true)
      unlinkFile(appJSONPath)
    })
})
