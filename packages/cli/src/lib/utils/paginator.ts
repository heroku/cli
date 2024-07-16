/* eslint-disable no-await-in-loop */
// page size ranges from 200 - 1000 seen here
// https://devcenter.heroku.com/articles/platform-api-reference#ranges

// This paginator uses status code to determine passing the Next-Range header
import {APIClient} from '@heroku-cli/command'

export async function paginateRequest(client: APIClient, url: string, pageSize = 200) {
  let isPartial = true
  let isFirstRequest = true
  let nextRange: string | undefined = ''
  let aggregatedResponseBody: any[] = []

  while (isPartial) {
    const response: any = await client.get<Array<any>>(url, {
      headers: {
        Range: `${(isPartial && !isFirstRequest) ? `${nextRange}` : `id ..; max=${pageSize};`}`,
      },
      partial: true,
    })

    aggregatedResponseBody = [...response.body, ...aggregatedResponseBody]
    isFirstRequest = false

    if (response.statusCode === 206) {
      nextRange = response.headers['next-range']
    } else {
      isPartial = false
    }
  }

  return aggregatedResponseBody
}
