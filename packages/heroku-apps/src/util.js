'use strict'

exports.mkdirp = (dir, opts) => {
  let mkdirp = require('mkdirp')
  return new Promise((resolve, reject) => mkdirp(dir, opts, (err) => err ? reject(err) : resolve()))
}
