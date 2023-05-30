#!/usr/bin/env node

const execa = require('execa')
const getHerokuS3Bucket = require('../utils/getHerokuS3Bucket')
const qq = require('qqjs')
const path = require('path')

const opts = {
  cwd: path.join(__dirname, '..', '..'),
  stdio: 'inherit'
}

qq.config.silent = false
qq.run(async () => {
  if (process.env.GITHUB_REF_NAME.startsWith('release-')) {
    const HEROKU_S3_BUCKET = getHerokuS3Bucket()
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install-standalone.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-standalone.sh s3://${HEROKU_S3_BUCKET}/install.sh`, opts)
    await execa.command(`aws s3 cp --content-type text/plain --cache-control max-age=604800 ./install-ubuntu.sh s3://${HEROKU_S3_BUCKET}/install-ubuntu.sh`, opts)
  } else {
    console.log('Not on stable release, skipping updating install scripts')
  }
})
