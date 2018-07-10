import React from 'react'
import ReactDOM from 'react-dom'

import {forceRenderStyles} from 'typestyle'
import {deleteNullValues, EventDispatcher, ObjectMap} from '@karma.run/editor-common'

import {Theme, defaultTheme} from './context/theme'
import {ThemeProvider} from './provider/theme'

import {Config, defaultConfig} from './context/config'
import {ConfigProvider} from './provider/config'

import {SessionProviderContainer} from './provider/session'
import {LocaleProvider} from './provider/locale'
import {LocationProviderContainer} from './provider/location'
import {NotificationProvider} from './provider/notification'

import {RootViewContainer} from './ui/rootView'
import {ErrorBoundary} from './error/boundary'
import {Environment} from './util/env'

export interface EditorProps {
  config?: Partial<Config>
  theme?: Partial<Theme>
}

export class EditorComponent extends React.Component<EditorProps> {
  public async componentDidMount() {
    // Prevent dropping files on window.
    window.addEventListener(
      'dragover',
      (e: DragEvent) => {
        e.preventDefault()
      },
      false
    )

    window.addEventListener(
      'drop',
      (e: DragEvent) => {
        e.preventDefault()
      },
      false
    )

    window.addEventListener('beforeunload', e => {
      if (false) {
        // TODO: Check for unsafed changed
        const message = 'Changes that you made may not be saved'
        e.returnValue = message
        return message
      }

      return undefined
    })

    // To prevent FOUC on initial render
    forceRenderStyles()
  }

  public render() {
    const config = {...defaultConfig, ...deleteNullValues(this.props.config)}
    const theme = {...defaultTheme, ...deleteNullValues(this.props.theme)}

    return (
      <React.StrictMode>
        <ErrorBoundary>
          <ConfigProvider config={config}>
            <LocaleProvider>
              <SessionProviderContainer>
                <LocationProviderContainer>
                  <ThemeProvider theme={theme}>
                    <NotificationProvider>
                      <RootViewContainer />
                    </NotificationProvider>
                  </ThemeProvider>
                </LocationProviderContainer>
              </SessionProviderContainer>
            </LocaleProvider>
          </ConfigProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )
  }
}

export interface EditorOptions {
  theme?: Partial<Theme>
}

export interface EditorEventMap {
  configLoaded: Environment
}

export class Editor extends EventDispatcher<EditorEventMap> {
  private opts: EditorOptions

  constructor(opts: EditorOptions = {}) {
    super()
    this.opts = opts
  }

  public attach(element?: HTMLElement) {
    if (!element) {
      element = document.getElementById('EditorRoot')!
      if (!element) throw new Error('Default element #EditorRoot could not be found!')
    }

    const serverConfigElement = document.getElementById('Config')
    const serverConfig: Config =
      serverConfigElement && serverConfigElement.textContent
        ? JSON.parse(serverConfigElement.textContent)
        : {}

    this.dispatch('configLoaded', serverConfig)

    ReactDOM.render(<EditorComponent {...this.opts} config={serverConfig} />, element)
  }
}
