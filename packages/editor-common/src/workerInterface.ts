import {Filter, Sort} from './filterInterface'
import {MessageMap} from './worker'

export interface WorkerTypeMap extends MessageMap {
  hash: {input: {costFactor: number; value: string}; output: string}
  salt: {input: {costFactor: number}; output: string}

  filterAndSort: {
    input: {
      filter: Filter | undefined
      sort: Sort
      objects: any[]
    }
    output: any[]
  }
}
