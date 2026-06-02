import {APIClient, Command} from '@heroku-cli/command'
import {utils} from '@heroku/heroku-cli-util'

export default abstract class BaseDataCommand extends Command {
  get dataApi(): APIClient {
    const client = new APIClient(this.config)
    client.defaults.host = utils.pg.host()
    client.defaults.headers = {
      ...this.heroku.defaults.headers,
    }

    if (process.env.HEROKU_DATA_CONTROL_PLANE) {
      client.defaults.headers['X-Data-Control-Plane'] = process.env.HEROKU_DATA_CONTROL_PLANE
    }

    return client
  }
}
