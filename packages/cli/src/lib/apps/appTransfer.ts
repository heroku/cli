import {APIClient} from '@heroku-cli/command'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

type Options = {
  heroku: APIClient,
  appName: string,
  recipient: string,
  personalToPersonal: boolean,
  bulk: boolean,
}

export class AppTransfer {
  private heroku: APIClient
  private appName: string
  private recipient: string
  private personalToPersonal: boolean
  private opts: Options
  private body: { app?: string; recipient?: string, owner?: string }
  private transferMsg: string
  private path: string
  private method: string

  /**
   * @param {Object} options.heroku - instance of heroku-client
   * @param {string} options.appName - application that is being transferred
   * @param {string} options.recipient - recipient of the transfer
   * @param {boolean} options.personalToPersonal - determines if it is a transfer between individual accounts
   * @param {boolean} options.bulk - determines if it is a bulk transfer
   * @param {Options} opts
   */
  constructor(opts: Options) {
    this.opts = opts
    this.heroku = this.opts.heroku
    this.appName = this.opts.appName
    this.recipient = this.opts.recipient
    this.personalToPersonal = this.opts.personalToPersonal

    if (this.personalToPersonal === undefined) this.personalToPersonal = true

    if (this.personalToPersonal) {
      this.body = {app: this.appName, recipient: this.recipient}
      this.transferMsg = `Initiating transfer of ${color.app(this.appName)}`
      if (!this.opts.bulk) this.transferMsg += ` to ${color.magenta(this.recipient)}`
      this.path = '/account/app-transfers'
      this.method = 'POST'
    } else {
      this.body = {owner: this.recipient}
      this.transferMsg = `Transferring ${color.app(this.appName)}`
      if (!this.opts.bulk) this.transferMsg += ` to ${color.magenta(this.recipient)}`
      this.path = `/teams/apps/${this.appName}`
      this.method = 'PATCH'
    }
  }

  async start() {
    ux.action.start(this.transferMsg)
    const {body: request} = await this.init()
    if (request.state === 'pending') ux.log('email sent')
    ux.action.stop()
  }

  init() {
    return this.heroku.request<Heroku.TeamApp>(
      this.path,
      {
        method: this.method,
        body: this.body,
      })
  }
}
