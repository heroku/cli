module.exports = () => {
  const path = require('path')
  const root = path.join(__dirname, '../../tmp/test')
  const fs = require('fs-extra')
  return fs.emptyDir(root)
}
