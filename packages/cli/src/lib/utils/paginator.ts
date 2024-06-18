import {APIClient} from '@heroku-cli/command'
// import * as Heroku from '@heroku-cli/schema'

// page size ranges from 200 - 1000 seen here
// https://devcenter.heroku.com/articles/platform-api-reference#ranges

export async function paginateRequest(client: APIClient, url: string, pageSize = 1000) {
  console.log('pageSize', pageSize)
  const response = await client.get<Array<any>>(url, {
    headers: {
      Range: `hostname ..; max=${pageSize};`,
    },
  })
  return response
}

// const {body: domains, headers: headerInfo} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
