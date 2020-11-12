'use strict'

function download (url, path, opts) {
  const progress = require('smooth-progress')
  const bytes = require('bytes')
  const https = require('https')
  const fs = require('fs')
  const mkdirp = require('mkdirp')
  const tunnel = require('tunnel-agent')
  const tty = process.stderr.isTTY && process.env.TERM !== 'dumb'

  function showProgress (rsp) {
    let bar = progress({
      tmpl: `Downloading ${path}... :bar :percent :eta :data`,
      width: 25,
      total: parseInt(rsp.headers['content-length'])
    })
    let total = 0
    rsp.on('data', function (chunk) {
      total += chunk.length
      bar.tick(chunk.length, { data: bytes(total, { decimalPlaces: 2, fixedDecimals: 2 }) })
    })
  }

  function makeAgent() {
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy

    if (!proxy) {
      return
    }

    const proxyUrl = new URL(proxy)
    return tunnel.httpsOverHttp({
      proxy: {
        host: proxyUrl.hostname,
        port: proxyUrl.port || 8080,
        proxyAuth: proxyUrl.auth
      }
    })
  }

  return new Promise(function (resolve, reject) {
    mkdirp.sync(require('path').dirname(path))
    let agent = makeAgent()
    let file = fs.createWriteStream(path)
    https.get(url, { agent }, function (rsp) {
      if (tty && opts.progress) showProgress(rsp)
      rsp.pipe(file)
        .on('error', reject)
        .on('close', resolve)
    })
  })
}

module.exports = download
