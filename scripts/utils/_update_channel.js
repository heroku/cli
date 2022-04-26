const qq = require('qqjs')
const fs = require('fs')
const path = require('path')

module.exports = () => {
  const pjsonPath = path.join(__dirname, '..', '..', 'packages', 'cli', 'package.json')
  const pjson = require(pjsonPath)
  if (process.env.CIRCLE_TAG && process.env.CIRCLE_TAG.startsWith('v')) {
    pjson.version = pjson.version.split('-')[0]
  } else if (process.env.CIRCLE_BRANCH === 'master') {
    pjson.version = pjson.version.split('-')[0] + '-beta'
  } else {
    pjson.version = pjson.version.split('-')[0] + '-dev'
  }
  fs.writeFileSync(pjsonPath, JSON.stringify(pjson, null, 2), {encoding: 'utf8'})
}
