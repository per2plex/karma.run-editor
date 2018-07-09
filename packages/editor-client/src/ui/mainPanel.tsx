import React from 'react'
import shortid from 'shortid'
import {Ref} from '@karma.run/sdk'

import {withLocation, LocationContext, AppLocation, LocationType} from '../context/location'
import {withSession, SessionContext, ModelRecord} from '../context/session'
import {StackView} from './common/stackView'
import {RootRecordListPanelContainer, SelectRecordListPanelContainer} from './recordListPanel'
import {Deferred, lastItemThrow} from '@karma.run/editor-common'
import {RecordEditPanelContainer} from './recordEditPanel'

export const enum PanelType {
  RootList = 'rootList',
  SelectList = 'selectList',
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

export function NotFoundContext(id: string = shortid.generate()): NotFoundContext {
  return {type: PanelType.NotFound, id}
}

export interface RootListPanelContext extends BasePanelContext {
  type: PanelType.RootList
  model: Ref
}

export function RootListPanelContext(
  model: Ref,
  id: string = shortid.generate()
): RootListPanelContext {
  return {type: PanelType.RootList, id, model}
}

export interface SelectListPanelContext extends BasePanelContext {
  type: PanelType.SelectList
  model: Ref
  resultRecord: Deferred<ModelRecord | undefined>
}

export function SelectListPanelContext(
  model: Ref,
  id: string = shortid.generate()
): SelectListPanelContext {
  return {type: PanelType.SelectList, id, model, resultRecord: new Deferred()}
}

export interface EditPanelContext extends BasePanelContext {
  type: PanelType.Edit
  model: Ref
  recordID?: Ref
  resultRecord: Deferred<ModelRecord | undefined>
}

export function EditPanelContext(
  model: Ref,
  recordID?: Ref,
  id: string = shortid.generate()
): EditPanelContext {
  return {
    type: PanelType.Edit,
    resultRecord: new Deferred(),
    recordID,
    model,
    id
  }
}

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
  | SelectListPanelContext
  | EditPanelContext
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

  // TODO: Handle
  private getRootPanelContextForLocation(location: AppLocation) {
    const sessionContext = this.props.sessionContext
    switch (location.type) {
      case LocationType.EntryList:
        const viewContext = sessionContext.viewContextSlugMap.get(location.slug)
        if (!viewContext) return NotFoundContext('notFound')

        return RootListPanelContext(viewContext.model, `root.${location.slug}`)

      default:
      case LocationType.NotFound:
        return NotFoundContext('notFound')
    }
  }

  private handleEditRecord = async (model: Ref, id?: Ref) => {
    const context = EditPanelContext(model, id)
    this.pushPanelContext(context)

    return await context.resultRecord
  }

  private handleBack = (_model: Ref, record?: ModelRecord) => {
    const context = this.popPanelContext()

    switch (context.type) {
      case PanelType.SelectList:
      case PanelType.Edit:
        return context.resultRecord.resolve(record)
    }
  }

  private handleDeleteRecord = (_model: Ref, _id: Ref) => {
    // TODO
    // this.pushPanelContext(EditPanelContext(model, id))
  }

  private handleSelectRecord = async (model: Ref) => {
    const context = SelectListPanelContext(model)
    this.pushPanelContext(context)

    return await context.resultRecord
  }

  private pushPanelContext(context: PanelContext) {
    this.setState({
      panelContexts: [...this.state.panelContexts, context]
    })
  }

  private popPanelContext() {
    const panelContext = lastItemThrow(this.state.panelContexts)

    this.setState({
      panelContexts: [...this.state.panelContexts.slice(0, -1)]
    })

    return panelContext
  }

  private getPanelForContext(context: PanelContext, disabled: boolean) {
    switch (context.type) {
      case PanelType.RootList:
        return (
          <RootRecordListPanelContainer
            model={context.model}
            disabled={disabled}
            onEditRecord={this.handleEditRecord}
            onDeleteRecord={this.handleDeleteRecord}
          />
        )

      case PanelType.SelectList:
        return (
          <SelectRecordListPanelContainer
            model={context.model}
            disabled={disabled}
            onBack={this.handleBack}
            onRecordSelected={this.handleBack}
          />
        )

      case PanelType.Edit:
        return (
          <RecordEditPanelContainer
            model={context.model}
            recordID={context.recordID}
            disabled={disabled}
            onBack={this.handleBack}
            onEditRecord={this.handleEditRecord}
            onSelectRecord={this.handleSelectRecord}
          />
        )

      default:
      case PanelType.NotFound:
        return <div>404</div>
    }
  }

  public render() {
    const panelContexts = [
      this.getRootPanelContextForLocation(this.props.locationContext.location!),
      ...this.state.panelContexts
    ]

    return (
      <StackView>
        {panelContexts.map((panelContext, index) => (
          <React.Fragment key={panelContext.id}>
            {this.getPanelForContext(panelContext, index !== panelContexts.length - 1)}
          </React.Fragment>
        ))}
      </StackView>
    )
  }
}

export const MainPanelContainer = withLocation(withSession(MainPanel))
