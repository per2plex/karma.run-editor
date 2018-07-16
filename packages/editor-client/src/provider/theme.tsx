import React from 'react'
import {Theme, ThemeContext} from '@karma.run/editor-common'

export interface ThemeProviderProps {
  theme: Theme
}

export class ThemeProvider extends React.Component<ThemeProviderProps> {
  public render() {
    return (
      <ThemeContext.Provider value={this.props.theme}>{this.props.children}</ThemeContext.Provider>
    )
  }
}
