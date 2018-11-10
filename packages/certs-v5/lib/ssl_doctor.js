'use strict'

let cli = require('heroku-cli-util')

module.exports = function (path, parts, message) {
  let logMessage = message || 'Resolving trust chain'

  let sslDoctor = process.env.SSL_DOCTOR_URL || 'https://ssl-doctor.heroku.com/'

  let postData = parts.join('\n')

  let postOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': Buffer.byteLength(postData)
    },
    body: postData
  }

  let promise = cli.got(sslDoctor + path, postOptions).then(function (response) {
    return response.body
  }).catch(function (error) {
    if (error.response && error.response.body) {
      throw new Error(error.response.body)
    } else {
      throw error
    }
  })

  return cli.action(logMessage, {}, promise)
}
