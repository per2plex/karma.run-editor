import * as React from 'react'
import {style} from 'typestyle'

import {
  Color,
  FontSize,
  withSession,
  SessionContext,
  withLocation,
  LocationContext
} from '@karma.run/editor-common'

import {SidePanelContainer} from './sidePanel'
// import {FlexList} from '../ui/common'

// import {
//   PanelManager,
//   ListPanelContext,
//   EditPanelContext,
//   DeletePanelContext,
//   PanelContext
// } from '../ui/panelManager'

// import {LocationType} from '../store/locationStore'
import {MainPanelContainer} from './mainPanel'

export interface BaseViewProps {
  locationContext: LocationContext
  sessionContext: SessionContext
}

export const BaseViewStyle = style({
  $debugName: 'BaseView',

  backgroundColor: Color.primary.light1,

  display: 'flex',
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

export class BaseView extends React.Component<BaseViewProps> {
  public render() {
    // const sessionContext = this.props.sessionContext

    // const location = this.props.locationContext.location!
    // const editorStore = this.props.applicationStore.editorStore

    // let content: React.ReactNode

    // if (location.type === LocationType.EntryList) {
    //   const viewContext = sessionContext.viewContexts.find(viewContext => {
    //     return viewContext.slug === location.slug || viewContext.model[1] === location.slug
    //   })!

    //   const contexts = [ListPanelContext(viewContext)]

    //   content = (
    //     <PanelManager initialContext={contexts} applicationStore={this.props.applicationStore} />
    //   )
    // } else if (
    //   location.type === LocationType.EntryNew ||
    //   location.type === LocationType.EntryEdit
    // ) {
    //   const entryID = location.type === LocationType.EntryEdit ? location.id : undefined
    //   const selectedViewContext = editorStore.viewContexts.find(viewContext => {
    //     return viewContext.slug === location.slug || viewContext.model[1] === location.slug
    //   })

    //   if (!selectedViewContext)
    //     return <div className={`${BaseViewStyle}_error`}>Invalid model!</div>

    //   const contexts = [
    //     ListPanelContext(selectedViewContext),
    //     EditPanelContext(selectedViewContext, entryID)
    //   ]

    //   content = (
    //     <PanelManager initialContext={contexts} applicationStore={this.props.applicationStore} />
    //   )
    // } else if (location.type === LocationType.EntryDelete) {
    //   const entryID = location.id
    //   const selectedViewContext = editorStore.viewContexts.find(viewContext => {
    //     return viewContext.slug === location.slug
    //   })

    //   if (!selectedViewContext)
    //     return <div className={`${BaseViewStyle}_error`}>Invalid model!</div>

    //   const contexts = [
    //     ListPanelContext(selectedViewContext),
    //     DeletePanelContext(selectedViewContext, entryID)
    //   ]

    //   content = (
    //     <PanelManager initialContext={contexts} applicationStore={this.props.applicationStore} />
    //   )
    // } else if (location.type === LocationType.NotFound) {
    //   content = <div className={`${BaseViewStyle}_error`}>Not Found</div>
    // } else if (location.type === LocationType.NoPermission) {
    //   content = <div className={`${BaseViewStyle}_error`}>No Permission</div>
    // }

    return (
      <div className={BaseViewStyle}>
        <SidePanelContainer />
        <MainPanelContainer />
        {/* <div className={`${BaseViewStyle}_content`}>{content}</div> */}
      </div>
    )
  }
}

export const BaseViewContainer = withSession(withLocation(BaseView))
