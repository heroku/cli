import ts from 'typescript'
import {isModuleExportsObject} from './node-validators/isModuleExportsObject.js'
import {isCommandDeclaration} from './node-validators/isCommandDeclaration.js'

/**
 * Finds command declaration and returns it if found
 *
 * @param sourceFile
 * @returns undefined | ts.ObjectLiteralExpression
 */

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

