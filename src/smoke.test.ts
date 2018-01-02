import * as execa from 'execa'

test('heroku version', async () => {
  const { stdout } = await execa('heroku', ['version'])
  console.log(stdout)
})
// heroku help
// heroku auth:whoami

// # fetch an app to work with
// APP=$(heroku apps | head -n2 | tail -n1 | awk '{split($0, a); print a[1]}')
// heroku apps:info -a "$APP"
// heroku run --exit-code -a "$APP" echo "it works!"
