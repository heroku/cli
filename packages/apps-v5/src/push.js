module.exports = function push (remote) {
  return `git push ${remote || 'heroku'} main`
}
