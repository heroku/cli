#!/usr/bin/env node

import { execa } from 'execa'
import qq from 'qqjs'
import path from 'path'
import { fileURLToPath } from 'url'
import getHerokuS3Bucket from '../utils/getHerokuS3Bucket.js'
import isStableRelease from '../utils/isStableRelease.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const opts = {
  cwd: path.join(__dirname, '..', '..'),
  stdio: 'inherit'
}

qq.config.silent = false

qq.run(async () => {
  const {GITHUB_REF_TYPE, GITHUB_REF_NAME} = process.env

  if (isStableRelease(GITHUB_REF_TYPE, GITHUB_REF_NAME)) {
    const HEROKU_S3_BUCKET = await getHerokuS3Bucket()
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install-standalone.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-ubuntu.sh s3://${HEROKU_S3_BUCKET}/install-ubuntu.sh`, opts)
  } else {
    console.log('Not on stable release, skipping updating install scripts')
    process.exit(0)
  }
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
