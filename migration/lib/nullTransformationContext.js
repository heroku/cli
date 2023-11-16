import ts from 'typescript'
export const nullTransformationContext = new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'factory') {
      return ts.factory
    }

    return node => node
  },
})
