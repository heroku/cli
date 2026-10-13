import {APIClient} from '@heroku-cli/command'

const REPOSITORIES_API_ACCEPT = 'application/vnd.heroku+json; version=3.repositories-api'
const PER_PAGE = 100
const MAX_PAGES = 10

type PullRequest = {head?: {ref?: string}; number: number}

// Finds the open pull request whose head is the given branch in the pipeline's
// connected repository. Returns undefined when the branch has no pull request.
export default async function findPullRequestNumber(
  heroku: APIClient,
  pipelineId: string,
  branch: string,
): Promise<number | undefined> {
  for (let page = 1; page <= MAX_PAGES; page++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await heroku.get<PullRequest[]>(`/pipelines/${pipelineId}/repo/pull-requests?page=${page}&per_page=${PER_PAGE}`, {
      headers: {Accept: REPOSITORIES_API_ACCEPT},
      partial: true,
    })
    const match = res.body.find(pr => pr.head?.ref === branch)
    if (match) return match.number
    // 206 means there are more pages
    if (res.statusCode !== 206) return undefined
  }

  return undefined
}
