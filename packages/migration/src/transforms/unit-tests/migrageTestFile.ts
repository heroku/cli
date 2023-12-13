import ts from 'typescript'
import {nullTransformationContext} from '../../nullTransformationContext'
import {isTestDescribeCall} from './validators'

const {factory} = ts

const transformNode = <N extends ts.Node>(node: N, transform: (innerNode: ts.Node) => ts.Node) => {
  const visitor = (vNode: ts.Node): ts.Node => ts.visitEachChild(transform(vNode), visitor, nullTransformationContext)

  return ts.visitEachChild(node, visitor, nullTransformationContext)
}

const getNockInstanceVarNamesFromBeforeEach = (funcBody: ts.Block) => {
  const nockVarNames: string[] = []
  for (const statement of funcBody.statements) {
    if ()
  }

  return nockVarNames
}

const transformDescribe = (node: ts.Node) => {
  if (isTestDescribeCall(node)) {
    const nockReferences = getNockInstanceVarNamesFromBeforeEach(node.arguments[1].body)

    return node
  }

  return node
}

export const migrateTestFile = (sourceFile: ts.SourceFile): ts.SourceFile => {
  const transformed = transformNode(sourceFile, transformDescribe)

  return transformed
}
