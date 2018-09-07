'use strict'

module.exports = {
  notify: function (subtitle, message) {
    try {
      const { notify } = require('@heroku-cli/notifications')
      notify({
        title: 'heroku cli',
        subtitle,
        message,
        sound: true
      })
    } catch (err) {
      cli.warn(err)
    }
  }
}
