const isStableRelease = (refType, refName) => refType === 'tag' && refName.startsWith('v') && !refName.includes('-')

export default isStableRelease
