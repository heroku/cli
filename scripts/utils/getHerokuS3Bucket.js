import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getHerokuS3Bucket = async () => {
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const bucket = packageJson.oclif?.update?.s3?.bucket

  if (!bucket) {
    throw new Error('S3 bucket missing from package.json oclif.update.s3.bucket')
  }

  return bucket
}

export default getHerokuS3Bucket
