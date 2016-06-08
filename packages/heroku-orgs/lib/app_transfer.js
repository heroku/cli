'use strict';

let cli         = require('heroku-cli-util');

class AppTransfer {
  /**
   * @param {Object} options
   * @param {Object} options.heroku - instance of heroku-client
   * @param {string} options.appName - application that is being transferred
   * @param {string} options.recipient - recipient of the transfer
   * @param {boolean} options.personalAppTransfer - determines if it is a transfer between individual accounts
  */
  constructor (opts) {
    this.opts = opts;
    this.heroku = this.opts.heroku;
    this.appName = this.opts.appName;
    this.recipient = this.opts.recipient;
    this.personalAppTransfer = this.opts.personalAppTransfer;

    if (this.personalAppTransfer === undefined) this.personalAppTransfer = true;

    if (this.personalAppTransfer) {
      this.body = { app: this.appName, recipient: this.recipient };
      this.transferMsg = `Initiating transfer of ${cli.color.app(this.appName)}`;
      if (!this.opts.bulk) this.transferMsg += ` to ${cli.color.magenta(this.recipient)}`;
      this.path = `/account/app-transfers`;
      this.method = 'POST';
    } else {
      this.body = { owner: this.recipient };
      this.transferMsg = `Transferring ${cli.color.app(this.appName)}`;
      if (!this.opts.bulk) this.transferMsg += ` to ${cli.color.magenta(this.recipient)}`;
      this.path = `/organizations/apps/${this.appName}`;
      this.method = 'PATCH';
    }
  }

  start () {
    let request = this.init().then(request => {
      if (request.state === 'pending') cli.action.done('email sent');
    });
    return cli.action(this.transferMsg, request);
  }

  init() {
    return this.heroku.request({
      path: this.path,
      method: this.method,
      body: this.body
    });
  }
}

module.exports = AppTransfer;
