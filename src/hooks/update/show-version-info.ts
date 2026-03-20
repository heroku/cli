import * as color from '@heroku/heroku-cli-util/color'
import {Hook, ux} from '@oclif/core'

const showVersionInfo: Hook<'update'> = async function ({config}) {
  try {
    if (process.env.HIDE_HEROKU_RELEASE_NOTES === 'true') {
      return
    }

    ux.stdout('')
    ux.stdout(`${color.bold("=== What's New ===")}`)
    ux.stdout('')

    // Run the version:info command to show what's new
    await config.runCommand('version:info')

    // Ensure output is fully flushed
    ux.stdout('')
  } catch (error: any) {
    // Don't block the update if this fails
    ux.stdout('NOTE: This error can be ignored')
    ux.stdout(`- Set ${color.code('HIDE_HEROKU_RELEASE_NOTES=true')} to skip showing release notes in the future\n`)
    ux.stdout(error.message)
  }
}

export default showVersionInfo
