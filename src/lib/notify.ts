import {Notification, notify} from '@heroku-cli/notifications'
import {ux} from '@oclif/core/ux'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function herokuNotify(subtitle: string, message: string, success = true) {
  const contentImage = path.join(__dirname, `../assets/${success ? 'success' : 'error'}.png`)
  try {
    notify({
      contentImage,
      message,
      sound: true,
      subtitle,
      title: 'heroku cli',
    } as Notification)
  } catch (error: any) {
    ux.warn(error)
  }
}
