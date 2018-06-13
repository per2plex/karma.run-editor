import * as React from 'react'

import {style} from 'typestyle'
import {Spacing} from '../../style'

export namespace PanelContent {
  export interface Props {
    title: React.ReactNode
    content: React.ReactNode
  }
}

export class PanelContent extends React.Component {
  public render() {
    return <div className={PanelContent.Style}>{this.props.children}</div>
  }
}

export namespace PanelContent {
  export const Style = style({
    $debugName: 'PanelContent',
    padding: Spacing.large,
    flexGrow: 1
  })
}
