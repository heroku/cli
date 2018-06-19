'use strict'

module.exports = function () {
  /*
  Splits strings separated by commas into an array
  If the string is empty or null, an empty array is returned.
   */
  function splitCsv (string) {
    return (string || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  return {
    splitCsv
  }
}
