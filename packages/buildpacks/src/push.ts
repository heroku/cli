module.exports = function (remote?: string) {
  return `git push ${remote || 'heroku'} main`
}
