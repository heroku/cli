import * as path from 'path'
import {notify, Notification} from '@heroku-cli/notifications'
import {ux} from '@oclif/core'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function (subtitle: string, message: string, success = true) {
  const contentImage = path.join(__dirname, `../assets/${success ? 'success' : 'error'}.png`)
  try {
    notify({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      title: 'heroku cli',
      subtitle,
      message,
      contentImage,
      sound: true,
    } as Notification)
  } catch (error: any) {
    ux.warn(error)
  }
}
