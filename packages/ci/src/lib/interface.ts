// TODO: Pull from the Heroku variant

export interface TestRun {
  id?: string,

}

export interface TestNode {
  id?: string,
  exit_code?: number | undefined,
  setup_stream_url?: string,
  output_stream_url?: string,
}
