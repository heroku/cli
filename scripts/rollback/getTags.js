#!/usr/bin/env node

const {NPM_VERSION_LIST, ROLLBACK_CHANNEL, CURRENT_CHANNEL_LATEST} = process.env

const channelVersions = NPM_VERSION_LIST.filter(version => {
  if (ROLLBACK_CHANNEL === 'stable') return !version.includes('-')
  return version.includes(ROLLBACK_CHANNEL)
})

const latestVersion = ROLLBACK_CHANNEL === 'stable' ? CURRENT_CHANNEL_LATEST.latest : CURRENT_CHANNEL_LATEST[ROLLBACK_CHANNEL]

const getTargetVersion = () => {
  const latestIndex = channelVersions.indexOf(latestVersion)
  const targetVersion = channelVersions[latestIndex - 1]
  return targetVersion
}

const rollbackAndTargetVersions = {
  rollback: latestVersion,
  target: getTargetVersion(),
}

module.exports = {rollbackAndTargetVersions}
