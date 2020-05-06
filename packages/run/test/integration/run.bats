@test "run with shield app" {
  run ./bin/run run -a heroku-run-shield-test-app echo '1 2 3'
  echo $output
  [ "$status" -eq 0 ]
  [[ "$output" =~ "1 2 3" ]]
}
