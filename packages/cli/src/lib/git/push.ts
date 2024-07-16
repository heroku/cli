export default function push(remote?: string) {
  return `git push ${remote || 'heroku'} main`
}
