
const globby = require('globby')

const main = async function () {
  let paths = await globby(['packages/*/package.json'])
  paths = paths.map(c => c.replace('packages/', '').replace('/package.json', ''))
  console.log(paths)
}

main()
