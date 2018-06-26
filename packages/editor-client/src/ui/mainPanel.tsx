import React from 'react'
import shortid from 'shortid'

import {withLocation, LocationContext, AppLocation, LocationType} from '../context/location'
import {withSession, SessionContext} from '../context/session'
import {StackView} from './common/stackView'
import {RootRecordListPanelContainer} from './recordListPanel'
import {Ref} from '@karma.run/sdk'

export const enum PanelType {
  RootList = 'rootList',
  List = 'list',
  Edit = 'edit',
  Delete = 'delete',
  Editor = 'editor',
  JSONEditor = 'jsonEditor',
  NotFound = 'notFound'
}

export interface BasePanelContext {
  type: PanelType
  id: string
}

export interface NotFoundContext extends BasePanelContext {
  type: PanelType.NotFound
}

export function NotFoundContext(): NotFoundContext {
  return {type: PanelType.NotFound, id: shortid.generate()}
}

export interface RootListPanelContext extends BasePanelContext {
  type: PanelType.RootList
  model: Ref
}

export function RootListPanelContext(model: Ref): RootListPanelContext {
  return {type: PanelType.RootList, id: shortid.generate(), model}
}

export interface ListPanelContext extends BasePanelContext {
  type: PanelType.List
  model: Ref
}

export function ListPanelContext(model: Ref): ListPanelContext {
  return {type: PanelType.List, id: shortid.generate(), model}
}

// export interface EditPanelContext {
//   type: PanelType.Edit
//   contextID: string
//   id: string | undefined
//   viewContext: ViewContext
//   result: Deferred<string | undefined>
// }

// export function EditPanelContext(viewContext: ViewContext, id?: string): EditPanelContext {
//   return {
//     type: PanelType.Edit,
//     contextID: shortid.generate(),
//     viewContext,
//     id,
//     result: new Deferred()
//   }
// }

// export interface DeletePanelContext {
//   type: PanelType.Delete
//   contextID: string
//   id: string
//   viewContext: ViewContext
//   result: Deferred<string | undefined>
// }

// export function DeletePanelContext(viewContext: ViewContext, id: string): DeletePanelContext {
//   return {
//     type: PanelType.Delete,
//     contextID: shortid.generate(),
//     viewContext,
//     id,
//     result: new Deferred()
//   }
// }

// export interface EditorPanelContext {
//   type: PanelType.Editor
//   contextID: string
//   fieldStore: FieldStore
//   result: Deferred<any>
// }

// export function EditorPanelContext(fieldStore: FieldStore): EditorPanelContext {
//   return {type: PanelType.Editor, contextID: shortid.generate(), fieldStore, result: new Deferred()}
// }

// export interface JSONEditorPanelContext {
//   type: PanelType.JSONEditor
//   contextID: string
//   data: any
//   result: Deferred<any>
// }

// export function JSONEditorPanelContext(data: any): JSONEditorPanelContext {
//   return {type: PanelType.JSONEditor, contextID: shortid.generate(), data, result: new Deferred()}
// }

export type PanelContext =
  | RootListPanelContext
  | ListPanelContext
  // | EditPanelContext
  // | DeletePanelContext
  // | EditorPanelContext
  // | JSONEditorPanelContext
  | NotFoundContext

export interface MainPanelProps {
  sessionContext: SessionContext
  locationContext: LocationContext
}

export interface MainPanelState {
  panelContexts: PanelContext[]
}

export class MainPanel extends React.Component<MainPanelProps, MainPanelState> {
  public state: MainPanelState = {
    panelContexts: []
  }

  private getRootPanelContextForLocation(location: AppLocation) {
    const sessionContext = this.props.sessionContext
    switch (location.type) {
      case LocationType.EntryList:
        const viewContext = sessionContext.viewContextSlugMap.get(location.slug)
        if (!viewContext) return NotFoundContext()

        return RootListPanelContext(viewContext.model)

      default:
      case LocationType.NotFound:
        return NotFoundContext()
    }
  }

  private getPanelForContext(context: PanelContext, disabled: boolean) {
    switch (context.type) {
      case PanelType.RootList:
        return <RootRecordListPanelContainer model={context.model} disabled={disabled} />

      default:
      case PanelType.NotFound:
        return <div>404</div>
    }
  }

  public render() {
    const panelContexts = [
      this.getRootPanelContextForLocation(this.props.locationContext.location!)
    ]

    return (
      <StackView>
        {panelContexts.map(panelContext => (
          <React.Fragment key={panelContext.id}>
            {this.getPanelForContext(panelContext, false)}
          </React.Fragment>
        ))}
      </StackView>
    )
  }
}

export const MainPanelContainer = withLocation(withSession(MainPanel))
