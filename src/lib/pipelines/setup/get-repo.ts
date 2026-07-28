import {APIClient} from '@heroku-cli/command'

export default function getRepo(heroku: APIClient, name: string) {
  return heroku.get(`/repos/${name}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'},
    retryAuth: false,
  }).then((res: any) => res.body).catch((error: any) => {
    const err: any = new Error('Couldn\'t access that repo')
    err.statusCode = error.statusCode || error.http?.statusCode
    throw err
  })
}
