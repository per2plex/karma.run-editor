import React from 'react'
import {Theme, ThemeContext} from '../context/theme'

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
