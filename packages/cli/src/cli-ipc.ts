import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
const net = require('node:net')
const ipcEnabled = process.env.ALLOW_IPC_CONNECT === 'true'

export function setupIPC(config: any, opts: any) {
  // cancel IPC connection setup if ALLOW_IPC_CONNECT is not enabled
  if (!ipcEnabled) {
    return
  }

  ux.log(color.heroku(`Allow IPC Connection: ${color.green('true')}`))

  // setup IPC connection

  // check for specific arg values like --interactive
  //   console.log('argv', opts.argv)
}
