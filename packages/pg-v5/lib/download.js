'use strict'

function download (url, path, opts) {
  const progress = require('smooth-progress')
  const bytes = require('bytes')
  const https = require('https')
  const fs = require('fs')
  const mkdirp = require('mkdirp')
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

  return new Promise(function (resolve, reject) {
    mkdirp.sync(require('path').dirname(path))
    let file = fs.createWriteStream(path)
    https.get(url, function (rsp) {
      if (tty && opts.progress) showProgress(rsp)
      rsp.pipe(file)
        .on('error', reject)
        .on('close', resolve)
    })
  })
}

module.exports = download
