const path = require('path')

const getHerokuS3Bucket = () => {
  const pjsonPath = path.join(__dirname, '..', '..', 'packages', 'cli', 'package.json')
  const pjson = require(pjsonPath)
  const bucket = pjson.oclif?.update?.s3?.bucket

  if (!bucket) {
    throw new Error('S3 bucket missing from packages/cli/package.json')
  }

  return bucket
}

module.exports = getHerokuS3Bucket
