import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
const {Console} = require('node:console')
const net = require('node:net')
const ipcEnabled = process.env.ALLOW_IPC_CONNECT === 'true'

// TODO: successfully establish IPC connection
// TODO: successfully send data to IPC server
// TODO: push command messages to IPC server
// TODO: output data from node's console as optional output

export function setupIPC(config: any, opts: any) {
  // cancel IPC connection setup if ALLOW_IPC_CONNECT is not enabled
  if (!ipcEnabled) {
    return
  }

  ux.log(color.heroku(`Allow IPC Connection: ${color.green('true')}`))

  const vsCodeLogger = new Console({stdout: process.stdout, stderr: process.stderr})
  const vsCodeIpcPath = 'example/path/here'

  const connectListener = () => {
    ux.log('Connected to IPC server')
    socketConnection.end()
  }

  // establish IPC connection
  const socketConnection = net.createConnection(vsCodeIpcPath, connectListener)

  // establish connection capabilities

  // listen for 'data' events
  socketConnection.on('data', (data: Buffer | string) => {
    // read data and log output
    vsCodeLogger.log('Received from server: ', data.toString())
  })

  // listen for 'end' events
  socketConnection.on('end', () => {
    // close IPC connection
    socketConnection.end()
  })

  // listen for 'error' events
  socketConnection.on('error', () => {
    console.log('An error occurred')
    // close IPC connection
    socketConnection.end()
  })

  // check for specific arg values like --interactive
  //   console.log('argv', opts.argv)
}
