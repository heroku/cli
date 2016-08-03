'use strict'

const fs = require('fs')

exports.readJSON = file => {
  let body = fs.readFileSync(file)
  return JSON.parse(body)
}

exports.writeJSON = (file, body) => {
  return fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8')
}
