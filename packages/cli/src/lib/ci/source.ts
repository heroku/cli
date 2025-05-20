import {Command} from '@heroku-cli/command'
import * as fs from 'async-file'
import * as git from './git'
import got from 'got'
import debug from 'debug'

const ciDebug = debug('ci')

async function uploadArchive(url: string, filePath: string) {
  const request = got.stream.put(url, {
    headers: {
      'content-length': (await fs.stat(filePath)).size.toString(),
    },
  })

  fs.createReadStream(filePath).pipe(request)

  return new Promise((resolve: any, reject: any) => {
    request.on('error', reject)
    request.on('response', resolve)
  })
}

async function prepareSource(ref: any, command: Command) {
  const filePath = await git.createArchive(ref)
  const {body: source} = await command.heroku.post<any>('/sources')
  await uploadArchive(source.source_blob.put_url, filePath)
  return Promise.resolve(source)
}

export async function createSourceBlob(ref: any, command: Command) {
  try {
    const githubRepository = await git.githubRepository()
    const {user, repo} = githubRepository

    const {body: archiveLink} = await command.heroku.get<any>(`https://kolkrabbi.heroku.com/github/repos/${user}/${repo}/tarball/${ref}`)
    if (await command.heroku.request(archiveLink.archive_link, {method: 'HEAD'})) {
      return archiveLink.archive_link
    }
  } catch (error) {
    // the commit isn't in the repo, we will package the local git commit instead
    ciDebug('Commit not found in pipeline repository', error)
  }

  const sourceBlob = await prepareSource(ref, command)
  return sourceBlob.source_blob.get_url
}
