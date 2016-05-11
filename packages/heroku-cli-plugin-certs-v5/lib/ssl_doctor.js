'use strict'

let cli = require('heroku-cli-util')
let got = require('got')
let url = require('url')
let https = require('https')
let tunnel = require('tunnel-agent')

module.exports = function (path, parts, message) {
  let logMessage = message || 'Resolving trust chain'

  let sslDoctor = process.env.SSL_DOCTOR_URL || 'https://ssl-doctor.herokuapp.com/'

  let postData = parts.join('\n')

  let httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  let agent
  if (httpsProxy) {
    cli.hush(`proxy set to ${httpsProxy}`)
    let proxy = url.parse(httpsProxy)

    agent = tunnel.httpsOverHttp({
      proxy: {
        host: proxy.hostname,
        port: proxy.port || 8080
      }
    })
  } else {
    agent = new https.Agent()
  }

  let postOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': Buffer.byteLength(postData)
    },
    body: postData,
    agent: agent
  }

  let promise = got(sslDoctor + path, postOptions).then(function (response) {
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
