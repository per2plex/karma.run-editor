import React from 'react'
import {CenteredLoadingIndicator} from './common/loader'

export interface AsyncComponentProps {
  children: () => Promise<React.ReactNode>
}

export interface AsyncComponentState {
  component?: React.ReactNode
}

export class AsyncComponent extends React.Component<AsyncComponentProps, AsyncComponentState> {
  public state: AsyncComponentState = {}

  public async componentDidMount() {
    this.setState({
      component: await this.props.children()
    })
  }

  public render() {
    console.log(this.state.component)

    if (this.state.component) {
      return this.state.component
    }

    return <CenteredLoadingIndicator />
  }
}
