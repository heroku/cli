const fs = require('fs-extra')
const path = require('path')
let branch
try {
  branch = fs.readFileSync(path.join(__dirname, '..', 'BRANCH'), 'utf-8').trim()
} catch (err) {
  branch = 'v6'
}

module.exports = branch
