/* eslint-disable no-await-in-loop */
import {APIClient} from '@heroku-cli/command'
// import * as Heroku from '@heroku-cli/schema'

// page size ranges from 200 - 1000 seen here
// https://devcenter.heroku.com/articles/platform-api-reference#ranges

// use status code to determine passing Next-Range header

export async function paginateRequest(client: APIClient, url: string, pageSize = 1000) {
//   const isPartial = true
//   const isFirstRequest = true
//   const nextRange = ''
//   let aggregatedResponseBody: any = []

  const response = await client.get<Array<any>>(url, {headers: {Range: 'id ..; max=200;'}, partial: true})

  // while (isPartial) {
  //   console.log('pageSize', pageSize)
  //   // either construct headers before and pass them to range or
  //   // update the undefined type error on nextRange
  //   const response = await client.get<Array<any>>(url, {
  //     headers: {
  //       Range: `${(isPartial && !isFirstRequest) ? `${nextRange}` : `hostname ..; max=${pageSize};`}`,
  //     },
  //   })

  //   aggregatedResponseBody = [...response.body, ...aggregatedResponseBody]

  //   isFirstRequest = false

  //   if (response.statusCode === 206) {
  //     nextRange = response.headers['next-range']
  //   } else {
  //     isPartial = false
  //   }
  // }

  // return aggregatedResponseBody

  return response
}

// const {body: domains, headers: headerInfo} = await this.heroku.get<Array<Heroku.Domain>>(`/apps/${flags.app}/domains`)
