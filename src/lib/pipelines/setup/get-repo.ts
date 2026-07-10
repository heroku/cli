export default function getRepo(github: any, name: any) {
  return github.getRepo(name).catch((err: any) => {
    const error: any = new Error('Couldn\'t access that repo')
    error.statusCode = err.statusCode || err.http?.statusCode
    throw error
  })
}
