export default function () {
  const host = process.env.HEROKU_DATA_HOST
  return host ? host : 'api.data.heroku.com'
}
