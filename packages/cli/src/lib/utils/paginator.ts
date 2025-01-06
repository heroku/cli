// page size ranges from 200 - 1000 seen here
// https://devcenter.heroku.com/articles/platform-api-reference#ranges

// This paginator uses status code to determine passing the Next-Range header
import {APIClient} from '@heroku-cli/command'
import HTTP from '@heroku/http-call'

export async function paginateRequest<T = unknown>(client: APIClient, url: string, pageSize = 200): Promise<T[]> {
  let isPartial = true
  let isFirstRequest = true
  let nextRange: string | undefined = ''
  let aggregatedResponseBody: T[] = []

  while (isPartial) {
    const response: HTTP<T[]> = await client.get<T[]>(url, {
      headers: {
        Range: `${(isPartial && !isFirstRequest) ? `${nextRange}` : `id ..; max=${pageSize};`}`,
      },
      partial: true,
    })

    aggregatedResponseBody = [...response.body, ...aggregatedResponseBody]
    isFirstRequest = false

    if (response.statusCode === 206) {
      nextRange = response.headers['next-range'] as string
    } else {
      isPartial = false
    }
  }

  return aggregatedResponseBody
}
