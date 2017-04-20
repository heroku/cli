'use strict'

module.exports = function (context) {
  if (context.flags && context.flags.remote) {
    return `git push ${context.flags.remote} master`
  } else {
    return 'git push heroku master'
  }
}
