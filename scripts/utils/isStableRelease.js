const isStableRelease = (refType, refName) => refType === 'tag' && refName.startsWith('v') && !refName.includes('-')

module.exports = isStableRelease
