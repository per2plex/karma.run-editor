import { WorkerTypeMap, createWorkerInterface } from '@karma.run/editor-common'
import { Env } from './env'

const worker = new Worker(`${Env.basePath}/js/worker.js`)
const workerInterface = createWorkerInterface<WorkerTypeMap>(worker, {
  filterAndSort: undefined, salt: undefined, hash: undefined
})

export const DefaultSaltFactor = 12
export function generateSalt(costFactor: number = DefaultSaltFactor) {
  return workerInterface.salt({costFactor})
}

export function generateHash(value: string, costFactor: number = DefaultSaltFactor) {
  return workerInterface.hash({value, costFactor})
}
