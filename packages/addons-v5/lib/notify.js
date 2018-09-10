'use strict'

const path = require('path')

module.exports = {
  notify: function (subtitle, message, success=true) {
    const contentImage = path.join(__dirname, `../assets/${success ? 'success' : 'error'}.png`)
    try {
      const { notify } = require('@heroku-cli/notifications')
      notify({
        title: 'heroku cli',
        subtitle,
        message,
        contentImage,
        sound: true
      })
    } catch (err) {
      cli.warn(err)
    }
  }
}
