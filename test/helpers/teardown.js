module.exports = () => {
  const path = require('path')
  const root = path.join(__dirname, '../../tmp/test')
  const file = require('../../lib/file')
  return file.removeEmptyDirs(root)
}
