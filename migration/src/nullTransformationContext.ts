import ts from 'typescript'

export const nullTransformationContext: ts.TransformationContext = new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'factory') {
      return ts.factory
    }

    return (node: ts.Node) => node
  },
}) as ts.TransformationContext
