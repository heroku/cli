export type App = {
  name: string,
  stack: {
    name: string
  },
  build_stack: {
    name: string
  },
  locked: boolean,
  internal_routing: boolean,
  region: {
    name: string
  }
  owner: {
    email: string
  }
  space: {
    id: string,
    name: string
  }
}

export type Apps = App[]
