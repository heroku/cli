export default function () {
  return process.env.HEROKU_DATA_HOST || 'api.data.heroku.com'
}
