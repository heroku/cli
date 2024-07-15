/* eslint-disable no-await-in-loop */
import {APIClient} from '@heroku-cli/command'
// import * as Heroku from '@heroku-cli/schema'

// page size ranges from 200 - 1000 seen here
// https://devcenter.heroku.com/articles/platform-api-reference#ranges

// use status code to determine passing Next-Range header

export async function paginateRequest(client: APIClient, url: string, pageSize = 1000) {
  let isPartial = true
  let isFirstRequest = true
  let nextRange: string | undefined = ''
  let aggregatedResponseBody: any[] = []

  while (isPartial) {
    // console.log('WE ARE HERE')
    // console.log('pageSize', pageSize)
    // either construct headers before and pass them to range or
    // update the undefined type error on nextRange
    const response: any = await client.get<Array<any>>(url, {
      headers: {
        Range: `${(isPartial && !isFirstRequest) ? `${nextRange}` : `id ..; max=${pageSize};`}`,
      },
      partial: true,
    })

    // console.log('statusCode', response.statusCode)
    // console.log('responseHeaders', response.headers)
    // console.log('response.body.length', response.body.length)

    aggregatedResponseBody = [...response.body, ...aggregatedResponseBody]
    isFirstRequest = false

    if (response.statusCode === 206) {
      nextRange = response.headers['next-range']
    } else {
      isPartial = false
    }
  }

  // console.log('aggregatedResponseBody.length', aggregatedResponseBody.length)

  return aggregatedResponseBody
}
