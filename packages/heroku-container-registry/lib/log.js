module.exports = (visible, args) => {
  if (!visible) return
  console.log(`> docker ${ args.join(' ') }`)
}
