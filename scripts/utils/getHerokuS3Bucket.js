const path = require('path')

const getHerokuS3Bucket = async () => {
  const configPath = path.join(__dirname, '..', '..', 'packages', 'cli', 'oclif.config.mjs')
  // Use dynamic import to load ESM module from CommonJS
  const config = await import('file://' + configPath)
  const bucket = config.default?.update?.s3?.bucket

  if (!bucket) {
    throw new Error('S3 bucket missing from packages/cli/oclif.config.mjs')
  }

  return bucket
}

module.exports = getHerokuS3Bucket
