import {APIClient} from '@heroku-cli/command'
import {pg} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'

import Dyno from '../run/dyno.js'

export type RunPsqlThroughDynoOpts = {
  channelBinding?: 'disable' | 'require',
  command?: string,
  db: pg.ConnectionDetails,
  file?: string,
  heroku: APIClient,
  notificationSubtitle?: string,
}

export async function runPsqlThroughOneOffDyno({
  channelBinding = 'require',
  command,
  db,
  file,
  heroku,
  notificationSubtitle,
}: RunPsqlThroughDynoOpts): Promise<void> {
  if (file)
    ux.error("You can't use the --file flag on private networked databases.", {exit: 1})

  const attachmentName = db.attachment!.name
  const shared = `--set sslmode=require --set channel_binding=${channelBinding} $${attachmentName}_URL`

  let psqlCommand: string
  if (command) {
    psqlCommand = `psql -c "${command.replaceAll('"', String.raw`\"`)}" ${shared}`
  } else {
    const prompt = `${db.attachment!.app.name}::${attachmentName}%R%# `
    psqlCommand = `psql --set PROMPT1="${prompt}" --set PROMPT2="${prompt}" ${shared}`
  }

  const dyno = new Dyno({
    app: db.attachment!.app.name,
    attach: true,
    command: psqlCommand,
    env: `PGAPPNAME='psql ${command ? 'non-' : ''}interactive';PGSSLMODE=require;PGCHANNELBINDING=${channelBinding}`,
    'exit-code': true,
    heroku,
    'no-tty': false,
    notificationSubtitle,
    notify: false,
    showStatus: false,
  })

  try {
    await dyno.start()
  } catch (error: unknown) {
    const dynoError = error as Error & {exitCode?: number}
    if (dynoError.exitCode) {
      ux.error(dynoError.message, {code: String(dynoError.exitCode), exit: dynoError.exitCode})
    } else {
      throw error
    }
  }
}
