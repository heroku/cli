module.exports = {
  'heroku-redis': {
    image: 'redis',
    env: { 'REDIS_URL': 'redis://herokuRedis:6379' }
  },
  'rediscloud': {
    image: 'redis',
    env: { 'REDISCLOUD_URL': 'redis://rediscloud:6379' }
  },
  'heroku-postgresql': {
    image: 'postgres',
    env: { 'DATABASE_URL': 'postgres://postgres:@herokuPostgresql:5432/postgres' }
  },
  'mongolab': {
    image: 'mongo',
    env: { "MONGOLAB_URI": 'mongolab:27017' }
  },
  'memcachedcloud': {
    image: 'memcached',
    env: { 'MEMCACHEDCLOUD_SERVERS': 'memcachedcloud:11211' }
  }
};
