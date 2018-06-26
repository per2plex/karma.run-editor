import * as React from 'react'

import {style} from 'typestyle'

export class Panel extends React.Component {
  public render() {
    return <div className={Panel.Style}>{this.props.children}</div>
  }
}

export namespace Panel {
  export const Style = style({
    $debugName: 'Panel',
    flexGrow: 1,

    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'scroll'
  })
}
