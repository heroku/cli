import ts from 'typescript'
import {isModuleExportsObject} from './node-validators/isModuleExportsObject.js'
import {isCommandDeclaration} from './node-validators/isCommandDeclaration.js'

export function getCommandDeclaration(sourceFile: ts.SourceFile): undefined | ts.ObjectLiteralExpression {
  for (const node of sourceFile.statements) {
    if (isCommandDeclaration(node)) {
      return node.declarationList.declarations[0].initializer
    }

    if (ts.isExpressionStatement(node) && isModuleExportsObject(node.expression)) {
      return node.expression.right
    }
  }
}

