module.exports = {
  topic: 'ci',
  command: 'info',
  default: true,
  description: 'CI overivew',
  help: 'display CI information for the given pipeline',
  run: function (context) {
    console.log('Hello, World!')
  }
}
