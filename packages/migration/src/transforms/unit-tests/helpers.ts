import ts from 'typescript'
import _ from 'lodash'
import {
  isBeforeEachBlock,
  isNockChainedCall,
  isNockExpressionStatementInstantiation,
  isNockVariableDeclarationInstantiation,
  NockVariableDeclarationInstantiation,
} from './validators.js'
import {nullTransformationContext} from '../../nullTransformationContext.js'

const {factory} = ts

/* nodes are "upside down" compared to human reading. Given:
 * let api = nock('https://api.heroku.com:443')
   .post('/account/keys', {public_key: key})
   .reply(200)
 * node starts as `.reply(200)`, and last CallExpression/PropertyAccessExpression pair is our target `nock('https://api.heroku.com:443')`
 * */
export const getEndOfCallPropertyAccessChain = (node: ts.CallExpression): ts.Node => {
  let workingNode: ts.Node = node

  while (ts.isCallExpression(workingNode) || ts.isPropertyAccessExpression(workingNode)) {
    workingNode = workingNode.expression
  }

  return workingNode
}

