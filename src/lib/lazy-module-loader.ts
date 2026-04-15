/**
 * Centralized lazy module loader for heavy dependencies
 * Provides singleton pattern for loading and configuring expensive modules
 */

import type * as chronoType from 'chrono-node'
import type inquirerType from 'inquirer'
import type lodashType from 'lodash'
import type {MarkedExtension, marked as MarkedType} from 'marked'
import type * as yamlType from 'yaml'

/**
 * Singleton class for lazy-loading heavy npm packages
 */
class LazyModuleLoader {
  // Chrono (natural language date parser)
  private chronoModule?: typeof chronoType
  // Inquirer (interactive prompts)
  private inquirerModule?: typeof inquirerType
  // Lodash (utility library)
  private lodashModule?: typeof lodashType
  private markedConfigured = false
  // Marked (markdown parser) and marked-terminal (terminal renderer)
  private markedModule?: typeof import('marked')
  private markedTerminalModule?: typeof import('marked-terminal')
  // YAML parser
  private yamlModule?: typeof yamlType

  /**
   * Generic lazy loader for any module
   * Returns the entire module namespace
   */
  async load<T = any>(moduleName: string): Promise<T> {
    return import(moduleName)
  }

  /**
   * Load chrono (natural language date parser)
   * Example: const chrono = await lazyModuleLoader.loadChrono()
   */
  async loadChrono(): Promise<typeof chronoType> {
    if (!this.chronoModule) {
      this.chronoModule = await import('chrono-node')
    }

    return this.chronoModule
  }

  /**
   * Load date-fns functions
   * Example: const {formatDistanceToNow} = await lazyModuleLoader.loadDateFns()
   */
  async loadDateFns(): Promise<typeof import('date-fns')> {
    return import('date-fns')
  }

  /**
   * Load inquirer (interactive prompts)
   * Example: const inquirer = await lazyModuleLoader.loadInquirer()
   */
  async loadInquirer(): Promise<typeof inquirerType> {
    if (!this.inquirerModule) {
      const inquirer = await import('inquirer')
      this.inquirerModule = inquirer.default
    }

    return this.inquirerModule
  }

  /**
   * Load lodash utility library
   * Example: const _ = await lazyModuleLoader.loadLodash()
   */
  async loadLodash(): Promise<typeof lodashType> {
    if (!this.lodashModule) {
      const lodash = await import('lodash')
      this.lodashModule = lodash.default
    }

    return this.lodashModule
  }

  /**
   * Load marked (markdown parser) configured for terminal output
   * Lazy-loads both marked and marked-terminal, configures once
   */
  async loadMarked(): Promise<typeof MarkedType> {
    if (!this.markedModule) {
      // Load both marked and marked-terminal in parallel
      const [marked, markedTerminal] = await Promise.all([
        import('marked'),
        import('marked-terminal'),
      ])

      this.markedModule = marked
      this.markedTerminalModule = markedTerminal

      // Configure marked with terminal renderer (only once)
      if (!this.markedConfigured) {
        marked.marked.use(markedTerminal.markedTerminal({emoji: false}) as MarkedExtension)
        this.markedConfigured = true
      }
    }

    return this.markedModule.marked
  }

  /**
   * Load yaml parser
   * Example: const {parse} = await lazyModuleLoader.loadYaml()
   */
  async loadYaml(): Promise<typeof yamlType> {
    if (!this.yamlModule) {
      this.yamlModule = await import('yaml')
    }

    return this.yamlModule
  }
}

// Export singleton instance
export const lazyModuleLoader = new LazyModuleLoader()
