import React from 'react'
import {style} from 'typestyle'
import {withLocation, LocationContext} from '../context/location'

export const MainPanelStyle = style({
  $debugName: 'MainPanel',

  width: '100%',
  height: '100%'
})

export interface MainPanelProps {
  locationContext: LocationContext
}

export class MainPanel extends React.Component<MainPanelProps> {
  public render() {
    return <div className={MainPanelStyle} />
  }
}

export const MainPanelContainer = withLocation(MainPanel)
