'use strict'

module.exports = function (s) {
  switch (s) {
    case 'success':
    case 'succeeded':
    case null:
      return {
        color: 'green'
      }
    case 'pending':
      return {
        color: 'yellow',
        content: 'release command executing'
      }
    case 'failure':
    case 'failed':
      return {
        color: 'red',
        content: 'release command failed'
      }
    default:
      return {
        color: 'white'
      }
  }
}
