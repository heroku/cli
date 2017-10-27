module.exports.topics = [
  {
    name: 'foo',
    description: 'foo topic description'
  }
]

module.exports.commands = [
  {
    topic: 'foo',
    command: 'alpha',
    description: 'foo:alpha description',
    flags: {
      bar: {description: 'bar flag', char: 'b'}
    }
  },
  {
    topic: 'foo',
    command: 'beta',
    description: 'foo:beta description',
    flags: {}
  }
]
