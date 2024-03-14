'use strict'
const got = require('got')
const api = require('./heroku-api')
const git = require('./git')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

async function uploadArchive(url, filePath) {
  const request = got.stream.put(url, {
    headers: {
      'content-length': ((await fs.statAsync(filePath))).size,
    },
  })

  fs.createReadStream(filePath).pipe(request)

  return new Promise((resolve, reject) => {
    request.on('error', reject)
    request.on('response', resolve)
  })
}

async function prepareSource(ref, context, heroku) {
  const [filePath, source] = await Promise.all([
    git.createArchive(ref),
    api.createSource(heroku),
  ])
  await uploadArchive(source.source_blob.put_url, filePath)
  return Promise.resolve(source)
}

async function urlExists(url) {
  return await got.head(url)
}

async function createSourceBlob(ref, context, heroku) {
  try {
    const githubRepository = await git.githubRepository()
    const {user, repo} = githubRepository
    const archiveLink = await api.githubArchiveLink(heroku, user, repo, ref)

    if (await urlExists(archiveLink.archive_link)) {
      return archiveLink.archive_link
    }
  } catch {}

  const sourceBlob = await prepareSource(ref, context, heroku)
  return sourceBlob.source_blob.get_url
}

module.exports = {
  createSourceBlob,
  prepareSource,
}
