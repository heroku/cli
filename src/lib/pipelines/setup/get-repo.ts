export default function getRepo(github: any, name: any) {
  return github.getRepo(name).catch(() => {
    throw new Error('Couldn\'t access that repo')
  })
}
