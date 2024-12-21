import {App} from '../../../src/lib/types/fir'

export const cedarApp: Partial<App> = {
  acm: false,
  buildpack_provided_description: 'Ruby',
  build_stack: {
    id: '8d4e0353-2043-4eba-b172-116cd8d24dad',
    name: 'heroku-22',
  },
  created_at: '2024-07-27T19:54:27Z',
  id: '8d76ca49-b876-41af-8ace-915d300804a6',
  git_url: 'https://git.heroku.com/my-cedar-app.git',
  maintenance: false,
  name: 'my-cedar-app',
  owner: {
    email: 'developer@example.com',
    id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c',
  },
  region: {
    id: '9afb627b-d4de-483a-9589-ff664a19fe9b',
    name: 'us',
  },
  organization: null,
  team: null,
  space: null,
  internal_routing: null,
  updated_at: '2024-10-17T16:20:42Z',
  web_url: 'https://my-cedar-app-a6b0f2f1519f.herokuapp.com/',
  generation: {name: 'cedar'},
}

export const firApp: Partial<App> = {
  acm: false,
  buildpack_provided_description: 'Cloud Native Buildpacks',
  build_stack: {
    id: 'e626530c-23db-4376-bd80-bcd298cb4ea6',
    name: 'cnb',
  },
  created_at: '2024-07-27T19:54:27Z',
  id: '745c1486-ad78-4de7-8da7-20d4f8b15b71',
  git_url: 'https://git.heroku.com/my-fir-app.git',
  maintenance: false,
  name: 'my-fir-app',
  owner: {
    email: 'developer@example.com',
    id: 'd7760946-8565-43f7-b4c0-7abf654c3a3c',
  },
  region: {
    id: '9afb627b-d4de-483a-9589-ff664a19fe9b',
    name: 'us',
  },
  organization: null,
  team: null,
  space: null,
  internal_routing: null,
  updated_at: '2024-10-17T16:20:42Z',
  web_url: 'https://my-fir-app-c07499750516.herokuapp.com/',
  generation: {name: 'fir'},
}
