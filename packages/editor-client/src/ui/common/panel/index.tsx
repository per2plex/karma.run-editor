import * as React from 'react'

import {style} from 'typestyle'

export namespace Panel {
  export interface Props {
    title: React.ReactNode
    content: React.ReactNode
  }
}

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
