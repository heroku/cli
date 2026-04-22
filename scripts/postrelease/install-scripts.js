#!/usr/bin/env node

import path from 'node:path'
import {fileURLToPath} from 'node:url'

import getHerokuS3Bucket from '../utils/get-heroku-s3-bucket.js'
import isStableRelease from '../utils/is-stable-release.js'
import {run, shell} from '../utils/script-exec.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const opts = {
  cwd: path.join(__dirname, '..', '..'),
  stdio: 'inherit',
}

await run(async () => {
  const {GITHUB_REF_NAME, GITHUB_REF_TYPE} = process.env

  if (isStableRelease(GITHUB_REF_TYPE, GITHUB_REF_NAME)) {
    const HEROKU_S3_BUCKET = await getHerokuS3Bucket()
    await shell(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install-standalone.sh`, opts)
    await shell(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install.sh`, opts)
    await shell(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-ubuntu.sh s3://${HEROKU_S3_BUCKET}/install-ubuntu.sh`, opts)
  } else {
    console.log('Not on stable release, skipping updating install scripts')
    // eslint-disable-next-line n/no-process-exit
    process.exit(0)
  }
})
