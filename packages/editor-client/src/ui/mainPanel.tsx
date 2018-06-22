import React from 'react'
import {style} from 'typestyle'

export const MainPanelStyle = style({
  $debugName: 'MainPanel',

  width: '100%',
  height: '100%'
})

export class MainPanel extends React.Component {
  public render() {
    return <div className={MainPanelStyle} />
  }
}
