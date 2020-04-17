const MULTIPLE_SNI_ENDPOINT_FLAG = 'allow-multiple-sni-endpoints'

function checkMultiSniFeature(featureList) {
  return featureList.some(feature => feature.name === MULTIPLE_SNI_ENDPOINT_FLAG && feature.enabled === true)
}

module.exports = checkMultiSniFeature
