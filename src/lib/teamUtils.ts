export const isTeamApp = function (owner: string | undefined) {
  return owner ? (/@herokumanager\.com$/.test(owner)) : false
}

export const getOwner = function (owner: string | undefined) {
  if (owner && isTeamApp(owner)) {
    return owner.split('@herokumanager.com')[0]
  }

  return owner
}

export const isValidEmail = function (email: string) {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)
}
