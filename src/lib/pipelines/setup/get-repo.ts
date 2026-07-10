export default function getRepo(github: any, name: any) {
  return github.getRepo(name).catch((error: any) => {
    const err: any = new Error('Couldn\'t access that repo')
    err.statusCode = error.statusCode || error.http?.statusCode
    throw err
  })
}
