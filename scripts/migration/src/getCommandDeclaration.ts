import ts from 'typescript'
import {isModuleExportsObject} from './node-validators/isModuleExportsObject'

/**
 * Finds command declaration and returns it if found
 *
 * @param sourceFile
 * @returns undefined | ts.ObjectLiteralExpression
 */

export function getCommandDeclaration(sourceFile: ts.SourceFile): undefined | ts.ObjectLiteralExpression {
  for (const node of sourceFile.statements) {
    if (
      ts.isVariableStatement(node) &&
      ts.isObjectLiteralExpression(node.declarationList.declarations[0].initializer)
    ) {
      for (const prop of  node.declarationList.declarations[0].initializer.properties) {
        if (ts.isIdentifier(prop.name) && prop.name.escapedText === 'run') {
          return node.declarationList.declarations[0].initializer
        }
      }
    } else if (ts.isExpressionStatement(node) && isModuleExportsObject(node.expression)) {
      return node.expression.right
    }
  }
}

