const MULTIPLE_SNI_ENDPOINT_FLAG = 'allow-multiple-sni-endpoints'
const PRIVATE_SNI_ENDPOINT_FLAG = 'private-spaces-sni'

function checkMultiSniFeature(featureList) {
  return featureList.some(feature => feature.name === MULTIPLE_SNI_ENDPOINT_FLAG && feature.enabled === true)
}

function checkPrivateSniFeature(featureList) {
  return featureList.some(feature => feature.name === PRIVATE_SNI_ENDPOINT_FLAG && feature.enabled === true)
}

module.exports = {
  checkMultiSniFeature,
  checkPrivateSniFeature
}
