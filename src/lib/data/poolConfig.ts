import type {DistinctChoice, ListChoiceMap} from 'inquirer'

import * as color from '@heroku/heroku-cli-util/color'
import inquirer from 'inquirer'
import tsheredoc from 'tsheredoc'

import {ExtendedPostgresLevelInfo, PoolInfoResponse} from './types.js'
import {renderLevelChoices, renderPricingInfo} from './utils.js'

const heredoc = tsheredoc.default
// eslint-disable-next-line import/no-named-as-default-member
const {prompt, Separator} = inquirer

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

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'Select the number of instances for this pool:',
      name: 'action',
      pageSize: 13 - this.followerInstanceCount + 2,
      type: 'list',
    })
    process.stderr.write('\n')

    return action
  }

  public async leaderInteractiveConfig(withGoBack: boolean = false): Promise<{action: '__confirm' | '__go_back', highAvailability?: boolean, level?: string}> {
    let configReady = false
    let currentStep = 'leaderLevel'
    let leaderLevel: string | undefined
    let highAvailability: boolean = true

    while (!configReady) {
      switch (currentStep) {
      case 'leaderLevel': {
        leaderLevel = await this.levelStep('Leader', undefined, withGoBack)
        process.stderr.write('\n')
        if (leaderLevel === '__go_back') {
          return {action: '__go_back'}
        }

        currentStep = 'highAvailability'
        break
      }

      case 'highAvailability': {
        switch (await this.highAvailabilityStep(leaderLevel!)) {
        case '__keep': {
          highAvailability = true
          currentStep = 'confirmation'
          break
        }

        case '__remove': {
          highAvailability = false
          currentStep = 'confirmation'
          break
        }

        case '__go_back': {
          currentStep = 'leaderLevel'
          break
        }
        }

        break
      }

      case 'confirmation': {
        switch (await this.leaderConfirmationStep(leaderLevel!, highAvailability)) {
        case '__confirm': {
          configReady = true
          break
        }

        case '__go_back': {
          currentStep = 'highAvailability'
          break
        }
        }

        break
      }
      }
    }

    return {action: '__confirm', highAvailability, level: leaderLevel!}
  }

  public async levelStep(kind: 'Follower' | 'Leader', pool?: PoolInfoResponse, withGoBack: boolean = false): Promise<string> {
    const {level} = await this.prompt<{level: string}>({
      choices: await renderLevelChoices(this.extendedLevelsInfo, pool, withGoBack),
      message: `Select a ${kind} Pool Level:`,
      name: 'level',
      pageSize: 12,
      type: 'list',
    })
    process.stderr.write('\n')

    return level
  }

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
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

    const {action} = await this.prompt<{action: string}>({
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
    const {action} = await this.prompt<{action: string}>({
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
        await this.prompt<{name: string}>({
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

  private async highAvailabilityStep(leaderLevel: string): Promise<string> {
    process.stderr.write(
      'The leader pool has high availability enabled and includes a standby instance for redundancy.\n'
      + 'If you disable high availability, you remove the standby and you won\'t have redundancy on your database.\n\n',
    )

    const leaderPricing = this.extendedLevelsInfo!.find(level => level.name === leaderLevel)?.pricing
    const {action} = await this.prompt<{action: string}>({
      choices: [
        {name: 'Keep high availability (HA)', value: '__keep'},
        {
          name: 'Remove high availability' + (
            renderPricingInfo(leaderPricing) === 'free'
              ? ''
              : ` ${color.yellowBright(`-${renderPricingInfo(leaderPricing).replace('~', '')}`)}`
          ),
          value: '__remove',
        },
        new Separator(),
        {name: 'Go back', value: '__go_back'},
      ],
      message: 'Do you want to keep the high availability standby instance?',
      name: 'action',
      type: 'list',
    })
    process.stderr.write('\n')

    return action
  }

  private async leaderConfirmationStep(leaderLevel: string, highAvailability: boolean): Promise<string> {
    const leaderLevelInfo = this.extendedLevelsInfo!.find(level => level.name === leaderLevel)
    const totalPrice = highAvailability
      ? renderPricingInfo(leaderLevelInfo?.pricing, 2)
      : renderPricingInfo(leaderLevelInfo?.pricing)
    const instancePrice = renderPricingInfo(leaderLevelInfo?.pricing)
    process.stderr.write(heredoc`
      ${`${color.green('✓ Configure Leader Pool')} ${totalPrice}`}
        ${color.dim(
    `${leaderLevel} ${leaderLevelInfo?.vcpu} ${color.inverse('vCPU')} `
          + `${leaderLevelInfo?.memory_in_gb} GB ${color.inverse('MEM')} `
          + instancePrice,
  )}
    `)
    if (highAvailability) {
      process.stderr.write(color.dim(`  Standby (High Availability) ${instancePrice}\n`))
    }

    process.stderr.write('\n')

    const {action} = await this.prompt<{action: string}>({
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
}
