import React from 'react'
import {ConfigContext, Config} from '../context/config'
import {CenteredLoadingIndicator} from '../ui/common/loader'

export interface ConfigProviderState {
  isLoadingPlugins: boolean
}

export async function loadScript(url: string): Promise<{}> {
  return new Promise((resolve, _reject) => {
    const script = document.createElement('script')

    script.src = url
    script.async = true

    script.addEventListener('load', () => {
      resolve()
    })

    document.head.appendChild(script)
  })
}

export class ConfigProvider extends React.Component<{config: Config}, ConfigProviderState> {
  public state: ConfigProviderState = {isLoadingPlugins: true}

  public async componentDidMount() {
    for (const [identifier, url] of this.props.config.plugins) {
      await loadScript(url)
      console.info(`Loaded plugin: ${identifier}`)
    }

    this.setState({isLoadingPlugins: false})
  }

  public render() {
    if (this.state.isLoadingPlugins) {
      return <CenteredLoadingIndicator />
    }

    return (
      <ConfigContext.Provider value={this.props.config}>
        {this.props.children}
      </ConfigContext.Provider>
    )
  }
}
