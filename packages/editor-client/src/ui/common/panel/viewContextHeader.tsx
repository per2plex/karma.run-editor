import * as React from 'react'

import {ViewContext} from '../../../api/karmafe/viewContext'
import {Markdown} from '../../common/markdown'
import {PanelHeader} from '../../common/panel/header'

export namespace ViewContextPanelHeader {
  export interface Props {
    viewContext: ViewContext
    prefix: string
  }
}

export class ViewContextPanelHeader extends React.Component<ViewContextPanelHeader.Props> {
  public render() {
    const title = `${this.props.prefix} / ${this.props.viewContext.name}`
    const description = this.props.viewContext.description ? (
      <Markdown source={this.props.viewContext.description} />
    ) : (
      undefined
    )

    return (
      <PanelHeader
        title={title}
        description={description}
        markerColor={this.props.viewContext.color}
      />
    )
  }
}
