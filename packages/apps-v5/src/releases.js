'use strict'

let FindRelease = function (heroku, app, search) {
  return heroku.request({
    path: `/apps/${app}/releases`,
    partial: true,
    headers: { 'Range': 'version ..; max=10, order=desc' }
  }).then(search)
}

let FindByLatestOrId = function (heroku, app, release) {
  let id = (release || 'current').toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id
  if (id === 'current') {
    return FindRelease(heroku, app, (releases) => releases[0])
  } else {
    return heroku.get(`/apps/${app}/releases/${id}`)
  }
}

module.exports = {
  FindRelease,
  FindByLatestOrId
}
