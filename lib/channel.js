const fs = require('fs-extra')
const path = require('path')
let channel
try {
  channel = fs.readFileSync(path.join(__dirname, '..', 'CHANNEL'), 'utf-8').trim()
} catch (err) {
  channel = 'stable'
}

module.exports = channel
