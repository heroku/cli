import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {color} from '@heroku/heroku-cli-util'
import {promises as fs} from 'node:fs'

const {writeFile, unlink} = fs
const unlinkFile = unlink
const {readFile} = fs

export default class CiMigrateManifest extends Command {
  static description = 'app-ci.json is deprecated. Run this command to migrate to app.json with an environments key.'
  static topic = 'ci'
  static examples = [
    color.command('heroku ci:migrate-manifest'),
  ]

  async run() {
    const appJSONPath = `${process.cwd()}/app.json`
    const appCiJSONPath = `${process.cwd()}/app-ci.json`
    let action: string

    function showWarning() {
      ux.stdout(color.green('Please check the contents of your app.json before committing to your repo.'))
    }

    async function updateAppJson() {
      // Updating / Creating
      ux.action.start(`${action.charAt(0).toUpperCase() + action.slice(1)} app.json file`)
      await writeFile(appJSONPath, `${JSON.stringify(appJSON, null, '  ')}\n`)
      ux.action.stop()
    }

    let appJSON: any
    let appCiJSON

    try {
      const fileContents = await readFile(appJSONPath, 'utf8')
      appJSON = JSON.parse(fileContents)
      action = 'updating'
    } catch {
      action = 'creating'
      appJSON = {}
    }

    try {
      const fileContents = await readFile(appCiJSONPath, 'utf8')
      appCiJSON = JSON.parse(fileContents)
    } catch {
      let msg = 'We couldn\'t find an app-ci.json file in the current directory'
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (appJSON.environments == null) {
        msg += `, but we're ${action} ${action === 'updating' ? 'your' : 'a new'} app.json manifest for you.`
        appJSON.environments = {}
        ux.stdout(msg)
        await updateAppJson()
        showWarning()
      } else {
        msg += ', and your app.json already has the environments key.'
        ux.stdout(msg)
      }
    }

    if (appCiJSON) {
      if (appJSON.environments && appJSON.environments.test) {
        ux.warn('Your app.json already had a test key. We\'re overwriting it with the content of your app-ci.json')
      }

      // eslint-disable-next-line no-eq-null, eqeqeq
      if (appJSON.environments == null) {
        appJSON.environments = {}
      }

      appJSON.environments.test = appCiJSON
      await updateAppJson()
      ux.action.start('Deleting app-ci.json file')
      await unlinkFile(appCiJSONPath)
      ux.action.stop()
      showWarning()
    }

    ux.stdout('You\'re all set! 🎉')
  }
}
