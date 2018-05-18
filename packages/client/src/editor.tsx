import React from 'react'
import ReactDOM from 'react-dom'
import { useStrict } from 'mobx'

import { applicationStore } from './store/applicationStore'
import { RootView } from './ui/rootView'
import { ErrorBoundary } from './error/boundary'
import { Theme, ThemeProvider, defaultTheme } from './context/theme'
import { Config, ConfigProvider, defaultConfig } from './context/config'
import { deleteNullValues, EventDispatcher } from '@karma.run/editor-common'
import { Environment, Env } from './util/env'

useStrict(true)

export interface EditorOptions {
  config: Partial<Config>
  theme: Partial<Theme>
}

export const defaultOptions: EditorOptions = {
  config: defaultConfig,
  theme: defaultTheme
}

export class EditorComponent extends React.Component<Partial<EditorOptions>> {
  public async componentDidMount() {
    // Prevent dropping files on window.
    window.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault()
    }, false)

    window.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault()
    }, false)

    window.addEventListener('beforeunload', (e) => {
      if (applicationStore.editorStore.hasUnsavedChanges) {
        const message = 'Changes that you made may not be saved'
        e.returnValue = message
        return message
      }

      return undefined
    })
  }

  public render() {
    const config = {...defaultConfig, ...deleteNullValues(this.props.config)}
    const theme = {...defaultTheme, ...deleteNullValues(this.props.theme)}

    return (
      <ErrorBoundary>
        <ConfigProvider config={config}>
          <ThemeProvider theme={theme}>
            <RootView applicationStore={applicationStore} />
          </ThemeProvider>
        </ConfigProvider>
      </ErrorBoundary>
    )
  }
}

export interface EditorEventMap {
  configLoaded: Environment
}

export class Editor extends EventDispatcher<EditorEventMap> {
  private opts: Partial<EditorOptions>

  constructor(opts: Partial<EditorOptions> = {}) {
    super()
    this.opts = opts
  }

  public attach(element?: HTMLElement) {
    if (!element) {
      element = document.getElementById('EditorRoot')!
      if (!element) throw new Error('Default element #EditorRoot could not be found!')
    }

    const serverConfigElement = document.getElementById('Config')
    const serverConfig: Environment = serverConfigElement
      ? JSON.parse(serverConfigElement.textContent || '{}')
      : {}

    this.dispatch('configLoaded', serverConfig)

    Env.overrideDefault(serverConfig)
    ReactDOM.render(<EditorComponent {...this.opts} />, element)
  }
}
