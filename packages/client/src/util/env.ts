import * as storage from './storage'
import * as debug from '../util/debug'

import { expose } from '../util/dev'
import { objectKeys, ObjectMap } from '@karma.run/editor-common'

export interface Environment {
  title: string
  basePath: string
  KARMA_API_URL?: string
  SENTRY_API_URL?: string
  KARMA_MEDIA_SERVER_URL?: string
  DEFAULT_DATABASE?: string
  DEFAULT_USERNAME?: string
  DEFAULT_PASSWORD?: string,
  custom: ObjectMap<any>
}

export type EnvironmentManager = Environment & {
  override(obj?: Partial<Environment>): void
  overrideDefault(obj?: Partial<Environment>): void
  clearOverride(): void
}

const overridenEnvironment: Partial<Environment> = storage.get('env') || {}

let defaultEnvironment: Environment = {
  title: 'karma.run',
  basePath: '',
  KARMA_API_URL: undefined,
  KARMA_MEDIA_SERVER_URL: undefined,
  SENTRY_API_URL: undefined,
  DEFAULT_DATABASE: undefined,
  DEFAULT_USERNAME: undefined,
  DEFAULT_PASSWORD: undefined,
  custom: {}
}

export const Env: EnvironmentManager = {
  overrideDefault(env: Partial<Environment>) {
    defaultEnvironment = {...defaultEnvironment, ...env}
  },

  override(env: Partial<Environment> = {}) {
    storage.set('env', {...overridenEnvironment, ...env})
    debug.info('Environment updated, reload for the changes to take effect!')
  },

  clearOverride() {
    storage.remove('env')
    debug.info('Environment updated, reload for the changes to take effect!')
  }
} as EnvironmentManager

objectKeys(defaultEnvironment).forEach((key) => {
  Object.defineProperty(Env, key, {
    set(value: string | undefined) {Env.override({[key]: value})},
    get() {return overridenEnvironment[key] || defaultEnvironment[key]}
  })
})

expose('Env', Env)
