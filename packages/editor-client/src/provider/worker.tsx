import React from 'react'
import {
  createWorkerInterface,
  WorkerTypeMap,
  MessageFunctionMap,
  WorkerContext,
  Config,
  withConfig
} from '@karma.run/editor-common'

export interface WorkerProviderProps {
  config: Config
}

export const DefaultCostFactor = 12
export class WorkerProvider extends React.Component<WorkerProviderProps, WorkerContext> {
  private worker: Worker
  private workerInterface: MessageFunctionMap<WorkerTypeMap>

  public constructor(props: WorkerProviderProps) {
    super(props)

    this.worker = new Worker(`${props.config.basePath}/static/worker.js`)
    this.workerInterface = createWorkerInterface<WorkerTypeMap>(this.worker, {
      filterAndSort: undefined,
      salt: undefined,
      hash: undefined
    })

    this.state = {
      generateSalt: this.generateSalt,
      generateHash: this.generateHash
    }
  }

  private generateSalt = async (costFactor: number = DefaultCostFactor) => {
    return this.workerInterface.salt({costFactor})
  }
  private generateHash = async (value: string, costFactor: number = DefaultCostFactor) => {
    return this.workerInterface.hash({value, costFactor})
  }

  public render() {
    return <WorkerContext.Provider value={this.state}>{this.props.children}</WorkerContext.Provider>
  }
}

export const WorkerProviderContainer = withConfig(WorkerProvider)
