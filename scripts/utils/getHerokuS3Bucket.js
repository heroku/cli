import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getHerokuS3Bucket = async () => {
  const configPath = path.join(__dirname, '..', '..', 'oclif.config.mjs')
  // Use dynamic import to load ESM module
  const config = await import('file://' + configPath)
  const bucket = config.default?.update?.s3?.bucket

  if (!bucket) {
    throw new Error('S3 bucket missing from oclif.config.mjs')
  }

  return bucket
}

export default getHerokuS3Bucket
