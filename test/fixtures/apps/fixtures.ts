import {App} from '../../../src/lib/types/fir.js'

export const cedarApp: Partial<App> = {
  acm: false,
  build_stack: {
    id: '8d4e0353-2043-4eba-b172-116cd8d24dad',
    name: 'heroku-22',
  },
  buildpack_provided_description: 'Ruby',
  created_at: '2024-07-27T19:54:27Z',
  generation: 'cedar',
  git_url: 'https://git.heroku.com/my-cedar-app.git',
  id: '8d76ca49-b876-41af-8ace-915d300804a6',
  internal_routing: null,
  maintenance: false,
  name: 'my-cedar-app',
  organization: null,
  owner: {
    email: 'developer@example.com',
    id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c',
  },
  region: {
    id: '9afb627b-d4de-483a-9589-ff664a19fe9b',
    name: 'us',
  },
  space: null,
  team: null,
  updated_at: '2024-10-17T16:20:42Z',
  web_url: 'https://my-cedar-app-a6b0f2f1519f.herokuapp.com/',
}

export const firApp: Partial<App> = {
  acm: false,
  build_stack: {
    id: 'e626530c-23db-4376-bd80-bcd298cb4ea6',
    name: 'cnb',
  },
  buildpack_provided_description: 'Cloud Native Buildpacks',
  created_at: '2024-07-27T19:54:27Z',
  generation: 'fir',
  git_url: 'https://git.heroku.com/my-fir-app.git',
  id: '745c1486-ad78-4de7-8da7-20d4f8b15b71',
  internal_routing: null,
  maintenance: false,
  name: 'my-fir-app',
  organization: null,
  owner: {
    email: 'developer@example.com',
    id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c',
  },
  region: {
    id: '9afb627b-d4de-483a-9589-ff664a19fe9b',
    name: 'us',
  },
  space: null,
  team: null,
  updated_at: '2024-10-17T16:20:42Z',
  web_url: 'https://my-fir-app-c07499750516.herokuapp.com/',
}
