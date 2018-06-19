function getRepo (github, name) {
  return github.getRepo(name).catch(() => {
    throw new Error(`Could not access the ${name} repo`)
  })
}

module.exports = getRepo
