export default function getRepo(github: any, name: any) {
  return github.getRepo(name).catch(() => {
    throw new Error(`Could not access the ${name} repo`)
  })
}
