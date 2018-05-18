import * as React from 'react'

import { style } from 'typestyle'

import { Color, FontSize } from '../ui/style'

import { observer } from 'mobx-react'
import { ApplicationStore } from '../store/applicationStore'
import { SidePanel } from './sidePanel'
import { FlexList } from '../ui/common'
import { PanelManager, ListPanelContext, EditPanelContext, DeletePanelContext } from '../ui/panelManager'

export namespace BaseView {
  export interface Props {
    applicationStore: ApplicationStore
  }
}

export const BaseViewStyle = style({
  $debugName: 'BaseView',

  backgroundColor: Color.primary.light1,

  flexGrow: 1,
  width: '100%',
  height: '100%',

  $nest: {
    '&_content': {
      display: 'flex',
      overflowY: 'hidden',

      width: '100%',
      height: '100%',
      flexGrow: 1
    },

    '&_error': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',

      width: '100%',
      height: '100%',

      fontSize: FontSize.large
    }
  }
})

@observer
export class BaseView extends React.Component<BaseView.Props> {
  public render() {
    const location = this.props.applicationStore.locationStore.location
    const editorStore = this.props.applicationStore.editorStore

    let content: React.ReactNode

    if (location.type === 'entryList') {
      const selectedViewContext = editorStore.viewContexts.find(viewContext => {
        return viewContext.slug === location.slug || viewContext.model === location.slug
      })!

      const contexts = [ListPanelContext(selectedViewContext)]

      content = (
        <PanelManager initialContext={contexts}
          applicationStore={this.props.applicationStore} />
      )
    } else if (location.type === 'entryNew' || location.type === 'entryEdit') {
      const entryID = location.type === 'entryEdit' ? location.id : undefined
      const selectedViewContext = editorStore.viewContexts.find(viewContext => {
        return viewContext.slug === location.slug || viewContext.model === location.slug
      })

      if (!selectedViewContext) return <div className={`${BaseViewStyle}_error`}>Invalid model!</div>

      const contexts = [
        ListPanelContext(selectedViewContext),
        EditPanelContext(selectedViewContext, entryID)
      ]

      content = (
        <PanelManager
          initialContext={contexts}
          applicationStore={this.props.applicationStore} />
      )
    } else if (location.type === 'entryDelete') {
      const entryID = location.id
      const selectedViewContext = editorStore.viewContexts.find(viewContext => {
        return viewContext.slug === location.slug
      })

      if (!selectedViewContext) return <div className={`${BaseViewStyle}_error`}>Invalid model!</div>

      const contexts = [
        ListPanelContext(selectedViewContext),
        DeletePanelContext(selectedViewContext, entryID)
      ]

      content = (
        <PanelManager
          initialContext={contexts}
          applicationStore={this.props.applicationStore} />
      )
    } else if (location.type === 'notFound') {
      content = (
        <div className={`${BaseViewStyle}_error`}>Not Found</div>
      )
    } else if (location.type === 'noPermission') {
      content = (
        <div className={`${BaseViewStyle}_error`}>No Permission</div>
      )
    }

    return (
      <div className={BaseViewStyle}>
        <FlexList spacing='none' direction='row' fill>
          <SidePanel editorStore={this.props.applicationStore.editorStore}
            locationStore={this.props.applicationStore.locationStore} />
          <div className={`${BaseViewStyle}_content`}>
            {content}
          </div>
        </FlexList>
      </div>
    )
  }
}