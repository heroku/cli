'use strict'

const path = require('path')
let cli = require('@heroku/heroku-cli-util')

module.exports = {
  notify: function (subtitle, message, success = true) {
    const contentImage = path.join(__dirname, `../assets/${success ? 'success' : 'error'}.png`)
    try {
      const {notify} = require('@heroku-cli/notifications')
      notify({
        title: 'heroku cli',
        subtitle,
        message,
        contentImage,
        sound: true,
      })
    } catch (error) {
      cli.warn(error)
    }
  },
}
