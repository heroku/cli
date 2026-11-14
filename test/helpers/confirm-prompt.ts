import {hux} from '@heroku/heroku-cli-util'
import * as sinon from 'sinon'

export type ConfirmPromptStub = {
  prompt: sinon.SinonStub
  restore: () => void
}

/**
 * Answers the prompt that `hux.confirmCommand` shows.
 *
 * `confirmCommand` calls heroku-cli-util's internal prompt, not `hux.prompt`, so stubbing `hux.prompt` doesn't reach
 * it. This stubs `hux.confirmCommand` to run the real implementation with a prompt stub injected, so the warning
 * still goes to stderr and the prompt text can be asserted on.
 */
export function stubConfirmPrompt(answer: string): ConfirmPromptStub {
  const {confirmCommand} = hux
  const prompt = sinon.stub().resolves(answer)
  const confirm = sinon.stub(hux, 'confirmCommand').callsFake(options => confirmCommand({...options, promptFunction: prompt}))
  return {prompt, restore: () => confirm.restore()}
}
