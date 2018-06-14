import React from 'react'
import {Omit} from '@karma.run/editor-common'

export interface Colors {
  primary: string
}

export interface Theme {
  logo: React.ComponentType
  smallLogo: React.ComponentType
  colors: Colors
}

const DefaultLogo: React.StatelessComponent = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 205.29 184.99">
    <path d="M161.44 159.49a2.19 2.19 0 0 1 2.19 2.19v10.56c0 5.55 2.18 8.36 6.48 8.36 5.6 0 6.44-5.24 6.44-8.36v-10.55a2.19 2.19 0 0 1 4.39 0v10.56c0 7.86-4.15 12.75-10.82 12.75s-10.87-4.77-10.87-12.75v-10.56a2.19 2.19 0 0 1 2.19-2.2zM203.1 185a2.19 2.19 0 0 1-2.19-2.19v-10.57c0-5.55-2.18-8.36-6.48-8.36-5.6 0-6.44 5.24-6.44 8.36v10.56a2.19 2.19 0 1 1-4.39 0v-10.56c0-7.86 4.15-12.75 10.82-12.75s10.87 4.77 10.87 12.75v10.56a2.19 2.19 0 0 1-2.19 2.2zm-59.15 0a2.19 2.19 0 0 1-2.19-2.19v-10.57a12.76 12.76 0 0 1 12.75-12.75 2.19 2.19 0 0 1 0 4.39 8.37 8.37 0 0 0-8.36 8.36v10.56a2.19 2.19 0 0 1-2.2 2.2zM33.42 159.49a12.75 12.75 0 1 0 8.36 22.35v1a2.19 2.19 0 1 0 4.39 0v-10.6a12.76 12.76 0 0 0-12.75-12.75zm0 21.11a8.36 8.36 0 1 1 8.36-8.36 8.37 8.37 0 0 1-8.36 8.37zm85.35-21.11a12.75 12.75 0 1 0 8.36 22.35v1a2.19 2.19 0 1 0 4.39 0v-10.6a12.76 12.76 0 0 0-12.75-12.75zm0 21.11a8.36 8.36 0 1 1 8.36-8.36 8.37 8.37 0 0 1-8.36 8.37zM18.5 160.14a2.19 2.19 0 0 0-3.1 0L4.84 170.69a2.18 2.18 0 0 0-.46.68v-9.8a2.19 2.19 0 1 0-4.39 0v21.11a2.19 2.19 0 1 0 4.39 0v-9.56a2.18 2.18 0 0 0 .46.68l10.56 10.55a2.19 2.19 0 1 0 3.1-3.1l-9-9 9-9a2.19 2.19 0 0 0 0-3.11zm43.67-.65a12.76 12.76 0 0 0-12.75 12.75v10.56a2.19 2.19 0 1 0 4.39 0v-10.56a8.37 8.37 0 0 1 8.36-8.36 2.19 2.19 0 0 0 0-4.39zm30.93 0a9.88 9.88 0 0 0-8.6 4.34 9.89 9.89 0 0 0-8.7-4.34c-6.68 0-10.82 4.89-10.82 12.75v10.56a2.19 2.19 0 1 0 4.39 0v-10.56c0-3.12.84-8.36 6.44-8.36 4.3 0 6.48 2.81 6.48 8.36v10.56a2.19 2.19 0 1 0 4.39 0v-10.56c0-3.12.84-8.36 6.44-8.36 4.3 0 6.48 2.81 6.48 8.36v10.56a2.19 2.19 0 1 0 4.39 0v-10.56c.01-7.98-4.08-12.75-10.89-12.75z" />
    <circle cx="136.71" cy="182.8" r="2.19" />
    <path d="M103.89 32.8l9.34 9.34 9.34 9.34 9.34 9.34 9.34 9.34h-37.36V32.8zm-2.65 0v105.67L48.4 85.64l52.84-52.84zM155.44 0l-18.7 21.6-18.7 21.6-2.94-2.93-2.94-2.94 21.65-18.67L155.44 0z" />
  </svg>
)

const DefaultSmallLogo: React.StatelessComponent = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 386.5 500">
    <path d="M200.34 118.42l33.73 33.73 33.73 33.73 33.72 33.72 33.73 33.73H200.34V118.42zM190.79 118.42V500L0 309.21l190.79-190.79zM386.5 0l-67.54 78-67.53 77.99-10.6-10.6-10.61-10.6 78.14-67.39L386.5 0z" />
  </svg>
)

export const defaultTheme: Theme = {
  logo: DefaultLogo,
  smallLogo: DefaultSmallLogo,
  colors: {
    primary: '#06323D'
  }
}

export const ThemeContext = React.createContext<Theme>(defaultTheme)
export class ThemeProvider extends React.Component<{theme: Theme}> {
  public render() {
    return (
      <ThemeContext.Provider value={this.props.theme}>{this.props.children}</ThemeContext.Provider>
    )
  }
}

export function withTheme<T extends {theme: Theme}>(
  Component: React.ComponentType<T>
): React.StatelessComponent<Omit<T, 'theme'>> {
  return props => (
    <ThemeContext.Consumer>{theme => <Component {...props} theme={theme} />}</ThemeContext.Consumer>
  )
}
