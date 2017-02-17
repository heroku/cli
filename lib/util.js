exports.compare = (...props) => {
  return (a, b) => {
    for (let prop of props) {
      if (a[prop] < b[prop]) return -1
      if (a[prop] > b[prop]) return 1
    }
    return 0
  }
}
