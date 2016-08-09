'use strict'

const fs = require('fs-extra')
const path = require('path')

exports.readJSON = file => {
  let body = fs.readFileSync(file)
  return JSON.parse(body)
}

exports.writeJSON = (file, body) => {
  fs.ensureDirSync(path.dirname(file))
  return fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8')
}
