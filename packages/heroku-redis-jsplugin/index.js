exports.commands = [
  require('./lib/commands/redis/cli'),
  require('./lib/commands/redis/info'),
  require('./lib/commands/redis/wait'),
  require('./lib/commands/redis/credentials'),
  require('./lib/commands/redis/promote'),
  require('./lib/commands/redis/timeout'),
  require('./lib/commands/redis/maxmemory')
];
