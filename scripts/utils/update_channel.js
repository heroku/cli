const fs = require('fs')
const path = require('path')

const update_channel = () => {
  const pjsonPath = path.join(__dirname, '..', '..', 'packages', 'cli', 'package.json')
  const pjson = require(pjsonPath)
  if (process.env.GITHUB_REF_NAME.startsWith('release-')) {
    pjson.version = pjson.version.split('-')[0]
  } else if (process.env.GITHUB_REF_NAME === 'master' || process.env.GITHUB_REF_NAME.startsWith('prerelease/')) {
    pjson.version = pjson.version.split('-')[0] + '-beta'
  } else {
    pjson.version = pjson.version.split('-')[0] + '-dev'
  }
  fs.writeFileSync(pjsonPath, JSON.stringify(pjson, null, 2), {encoding: 'utf8'})
}

try {
  update_channel()
} catch(err)  {
  console.error(`error running scripts/utils/update_channel.js`, err)
  process.exit(1)
}
