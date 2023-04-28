'use strict'

const path = require('path')

module.exports = context => opts => {
  if (context.flags['no-notify']) return
  const notifier = require('node-notifier')
  return notifier.notify({
    title: `heroku ${process.argv[2]}`,
    // icon: path.join('Terminal Icon'),
    icon: path.join(__dirname, '../assets/heroku.png'),
    // contentImage: path.join(__dirname, '../assets/heroku.png'),
    // open: // URL to open on Click
    // wait: false, // Wait for User Action against Notification or times out. Same as timeout = 5 seconds

    // New in latest version. See `example/macInput.js` for usage
    // timeout: 5, // Takes precedence over wait if both are defined.
    // closeLabel: void 0, // String. Label for cancel button
    // actions: void 0, // String | Array<String>. Action label or list of labels in case of dropdown
    // dropdownLabel: void 0, // String. Label to be used if multiple actions
    // reply: false // Boolean. If notification should take input. Value passed as third argument in callback and event emitter.
    ...opts,
  })
}
