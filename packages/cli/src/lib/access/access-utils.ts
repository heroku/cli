export const isTeamApp = function (owner: string | undefined) {
  return owner ? (/@herokumanager\.com$/.test(owner)) : false
}

export const getOwner = function (owner: string | undefined) {
  if (owner && isTeamApp(owner)) {
    return owner.split('@herokumanager.com')[0]
  }

  return owner
}
