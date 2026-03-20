import {APIClient, Command} from '@heroku-cli/command'
import * as pg from '@heroku/heroku-cli-util/utils/pg'

export default abstract class extends Command {
  get dataApi(): APIClient {
    const client = new APIClient(this.config)
    client.defaults.host = pg.getHost()
    client.defaults.headers = {
      ...this.heroku.defaults.headers,
    }

    if (process.env.HEROKU_DATA_CONTROL_PLANE) {
      client.defaults.headers['X-Data-Control-Plane'] = process.env.HEROKU_DATA_CONTROL_PLANE
    }

    return client
  }
}
