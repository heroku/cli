import type {DistinctChoice, ListChoiceMap} from 'inquirer'

import {color} from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import {ExtendedPostgresLevelInfo, PoolInfoResponse} from './types.js'
import {renderLevelChoices, renderPricingInfo} from './utils.js'

const heredoc = tsheredoc.default
// eslint-disable-next-line import/no-named-as-default-member
const {Separator, prompt} = inquirer

export default class PoolConfig {
  private followerCount: number | undefined
  private followerLevel: string | undefined
  private followerName: string | undefined

  constructor(
    private readonly extendedLevelsInfo: ExtendedPostgresLevelInfo[],
    private readonly followerInstanceCount: number,
  ) {}

  public async followerInteractiveConfig(): Promise<{count: number, level: string, name?: string}> {
    let configReady = false
    let currentStep = 'poolLevelSelection'
    let selection: string | undefined

    while (!configReady) {
      switch (currentStep) {
      case 'poolLevelSelection': {
        this.followerLevel = await this.levelStep('Follower')
        currentStep = 'poolInstancesSelection'
        break
      }

      case 'poolInstancesSelection': {
        selection = await this.instanceCountStep()
        switch (selection) {
        case '__go_back': {
          currentStep = 'poolLevelSelection'
          break
        }

        default: {
          this.followerCount = Number(selection)
          currentStep = 'poolNameSelection'
          break
        }
        }

        break
      }

      case 'poolNameSelection': {
        switch (await this.followerNameStep()) {
        case '__go_back': {
          currentStep = 'poolInstancesSelection'
          break
        }

        default: {
          currentStep = 'confirmation'
          break
        }
        }

        break
      }

      case 'confirmation': {
        switch (await this.followerConfirmationStep()) {
        case '__confirm': {
          configReady = true
          break
        }

        case '__go_back': {
          currentStep = 'poolNameSelection'
          break
        }
        }

        break
      }
      }
    }

    return {
      count: this.followerCount!,
      level: this.followerLevel!,
      name: this.followerName,
    }
  }

  public async instanceCountStep(pool?: PoolInfoResponse): Promise<string> {
    process.stderr.write(heredoc`

      A cluster can have up to 13 follower instances. Two or more instances in a pool enables high availability for redundancy.
      Adding more instances distributes the load in the follower pool.

    `)

    const choices: Array<DistinctChoice<{ action: string }, ListChoiceMap<{ action: string }>>>
      = Array
        .from({length: 13 - this.followerInstanceCount}, (_, index) => index + 1)
        .map((i: number) => ({disabled: i === pool?.expected_count ? 'current amount' : false, name: `${i} instance${i === 1 ? '' : 's'}`, value: i.toString()}))
    choices.push(
      new Separator(),
      {name: 'Go back', value: '__go_back'},
    )

    const {action} = await prompt<{action: string}>({
      choices,
      message: 'Select the number of instances for this pool:',
      name: 'action',
      pageSize: 13 - this.followerInstanceCount + 2,
      type: 'list',
    })
    process.stderr.write('\n')

    return action
  }

  public async levelStep(kind: 'Follower' | 'Leader', pool?: PoolInfoResponse, withGoBack: boolean = false): Promise<string> {
    const {level} = await prompt<{level: string}>({
      choices: await renderLevelChoices(this.extendedLevelsInfo, pool, withGoBack),
      message: `Select a ${kind} Pool Level:`,
      name: 'level',
      pageSize: 12,
      type: 'list',
    })
    process.stderr.write('\n')

    return level
  }

  private async followerConfirmationStep(): Promise<string> {
    const followerLevelInfo = this.extendedLevelsInfo.find(level => level.name === this.followerLevel)
    const totalPrice = renderPricingInfo(followerLevelInfo?.pricing, this.followerCount)

    process.stderr.write('\n')
    process.stderr.write(heredoc`
      ${`${color.green('✓ Configure Follower Pool')} ${totalPrice}`}
        ${this.followerName ? `${color.bold(this.followerName)}\n        ${color.dim(this.followerLevel)}` : `${color.dim(this.followerLevel)}`}
        ${color.dim(`${this.followerCount} instance${this.followerCount! > 1 ? 's (High Availability)' : ''}`)}
    `)
    process.stderr.write('\n')

    const {action} = await prompt<{action: string}>({
      choices: [
        {name: 'Confirm', value: '__confirm'},
        {name: 'Go back', value: '__go_back'},
      ],
      message: 'Confirm provisioning?',
      name: 'action',
      type: 'list',
    })
    process.stderr.write('\n')

    return action
  }

  private async followerNameStep(): Promise<string> {
    const {action} = await prompt<{action: string}>({
      choices: [
        {name: 'Yes', value: '__yes'},
        {name: 'No, assign a random name', value: '__no'},
        new Separator(),
        {name: 'Go back', value: '__go_back'},
      ],
      message: 'Do you want to name this follower pool?',
      name: 'action',
      type: 'list',
    })

    let name: string | undefined
    switch (action) {
    case '__yes': {
      process.stderr.write('\n')
      name = (
        await prompt<{name: string}>({
          message: 'Enter a unique pool name (3-32 lowercase letters and numbers, no spaces):',
          name: 'name',
          type: 'input',
        })
      ).name
      break
    }
    }

    this.followerName = name
    return action
  }
}
