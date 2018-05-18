import { WorkerTypeMap, createWorkerInterface, Filter, Sort } from '@karma.run/editor-common'
import { Env } from '../util/env'

const worker = new Worker(`${Env.basePath}/js/worker.js`)
const workerInterface = createWorkerInterface<WorkerTypeMap>(worker, {
  filterAndSort: undefined, salt: undefined, hash: undefined
})

export function filterAndSortObjects<T>(filter: Filter | undefined, sort: Sort, objects: T[]) {
  return workerInterface.filterAndSort({filter, sort, objects})
}
