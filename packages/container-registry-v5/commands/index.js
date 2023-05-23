module.exports = function index(pkg) {
  return {
    topic: pkg.topic,
    description: pkg.description,
    run: showVersion,
  }

  function showVersion() {
    console.log(pkg.version)
  }
}
