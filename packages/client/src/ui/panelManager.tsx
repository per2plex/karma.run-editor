import * as React from 'react'
import * as shortid from 'shortid'

import { observable, action, IObservableArray } from 'mobx'
import { observer } from 'mobx-react'

import { StackView } from '../ui/common/stackView'
import { EntryListPanel, ChooseEntryListPanel } from '../ui/entryListPanel'
import { ApplicationStore } from '../store/applicationStore'
import { ViewContext } from '../api/karmafe/viewContext'
import { Deferred } from '@karma.run/editor-common'
import { EntryNewLocation, EntryEditLocation, EntryDeleteLocation, EntryListLocation } from '../store/locationStore'
import { EntryEditPanel } from '../ui/entryEditPanel'
import { FieldStore } from '../store/fields/fieldStore'
import { EditorPanel } from '../ui/editorPanel'
import { EntryDeletePanel } from '../ui/entryDeletePanel'
import { JSONEditorPanel } from '../ui/jsonEditorPanel'

export const enum PanelType {
  List = 'list',
  ChooseList = 'chooseList',
  Edit = 'edit',
  Delete = 'delete',
  Editor = 'editor',
  JSONEditor = 'jsonEditor'
}

export interface PanelComponent {
  panelWillAppear(): void
  panelWillDisappear(): void
}

export interface ListPanelContext {
  type: PanelType.List
  contextID: string
  viewContext: ViewContext
}

export function ListPanelContext(viewContext: ViewContext): ListPanelContext {
  return {type: PanelType.List, contextID: shortid.generate(), viewContext}
}

export interface ChooseListPanelContext {
  type: PanelType.ChooseList
  contextID: string
  viewContext: ViewContext
  result: Deferred<string | undefined>
}

export function ChooseListPanelContext(viewContext: ViewContext): ChooseListPanelContext {
  return {type: PanelType.ChooseList, contextID: shortid.generate(), viewContext, result: new Deferred()}
}

export interface EditPanelContext {
  type: PanelType.Edit
  contextID: string
  id: string | undefined
  viewContext: ViewContext
  result: Deferred<string | undefined>
}

export function EditPanelContext(viewContext: ViewContext, id?: string): EditPanelContext {
  return {type: PanelType.Edit, contextID: shortid.generate(), viewContext, id, result: new Deferred()}
}

export interface DeletePanelContext {
  type: PanelType.Delete
  contextID: string
  id: string
  viewContext: ViewContext
  result: Deferred<string | undefined>
}

export function DeletePanelContext(viewContext: ViewContext, id: string): DeletePanelContext {
  return {type: PanelType.Delete, contextID: shortid.generate(), viewContext, id, result: new Deferred()}
}

export interface EditorPanelContext {
  type: PanelType.Editor
  contextID: string
  fieldStore: FieldStore
  result: Deferred<any>
}

export function EditorPanelContext(fieldStore: FieldStore): EditorPanelContext {
  return {type: PanelType.Editor, contextID: shortid.generate(), fieldStore, result: new Deferred()}
}

export interface JSONEditorPanelContext {
  type: PanelType.JSONEditor
  contextID: string
  data: any
  result: Deferred<any>
}

export function JSONEditorPanelContext(data: any): JSONEditorPanelContext {
  return {type: PanelType.JSONEditor, contextID: shortid.generate(), data, result: new Deferred()}
}

export type PanelContext =
  ListPanelContext
  | ChooseListPanelContext
  | EditPanelContext
  | DeletePanelContext
  | EditorPanelContext
  | JSONEditorPanelContext

export class PanelManagerStore {
  public contexts: IObservableArray<PanelContext> = observable.shallowArray()

  constructor(initialContext: PanelContext[]) {
    this.contexts.push(...initialContext)
  }

  @action
  public pushContext(context: PanelContext) {
    this.contexts.push(context)
  }

  @action
  public popContext() {
    return this.contexts.pop()!
  }
}


export namespace PanelManager {
  export interface Props {
    initialContext: PanelContext[]
    applicationStore: ApplicationStore
  }

  export interface State {
    store: PanelManagerStore
  }
}

@observer
export class PanelManager extends React.Component<PanelManager.Props, PanelManager.State> {
  private panelComponents = new Map<string, PanelComponent>()

  constructor(props: PanelManager.Props) {
    super(props)
    this.state = {store: new PanelManagerStore(props.initialContext)}
  }

  public componentWillReceiveProps(nextProps: PanelManager.Props) {
    if (this.props.initialContext !== nextProps.initialContext) {
      this.setState({store: new PanelManagerStore(nextProps.initialContext)})
    }
  }

  private getCurrentPanel(): PanelComponent {
    const contexts = this.state.store.contexts
    const lastContext = contexts[contexts.length - 1]
    const component = this.panelComponents.get(lastContext.contextID)

    return component!
  }

  private handleEntryChoose = (viewContext: ViewContext) => {
    const context = ChooseListPanelContext(viewContext)
    this.state.store.pushContext(context)

    return context.result
  }

  private handleEntryEdit = (viewContext: ViewContext, id?: string) => {

    if (id) {
      // TODO: Move outside of PanelManager
      if (this.state.store.contexts.length === 1) {
        this.props.applicationStore.locationStore.pushLocation(
          EntryEditLocation(viewContext.slug || viewContext.model, id), false
        )
      }
    } else {
      // TODO: Move outside of PanelManager
      if (this.state.store.contexts.length === 1) {
        this.props.applicationStore.locationStore.pushLocation(
          EntryNewLocation(viewContext.slug || viewContext.model), false
        )
      }
    }

    const context = EditPanelContext(viewContext, id)
    this.state.store.pushContext(context)

    return context.result
  }

  private handleEntryDelete = (viewContext: ViewContext, id: string) => {
    // TODO: Move outside of PanelManager
    if (this.state.store.contexts.length === 1) {
      this.props.applicationStore.locationStore.pushLocation(
        EntryDeleteLocation(viewContext.slug || viewContext.model, id), false
      )
    }

    this.state.store.pushContext(DeletePanelContext(viewContext, id))
  }

  private handleEntryChosen = (_viewContext: ViewContext, id: string | undefined) => {
    this.getCurrentPanel().panelWillDisappear()
    const context = this.state.store.popContext()
    this.getCurrentPanel().panelWillAppear()

    switch (context.type) {
      case PanelType.ChooseList: return context.result.resolve(id)
    }
  }

  private handleCancel = () => {
    this.getCurrentPanel().panelWillDisappear()
    this.state.store.popContext()
    this.getCurrentPanel().panelWillAppear()

    // TODO: Move outside of PanelManager
    if (this.state.store.contexts.length === 1) {
      const context = this.state.store.contexts[0] as ListPanelContext
      this.props.applicationStore.locationStore.pushLocation(
        EntryListLocation(context.viewContext.slug || context.viewContext.model), false
      )
    }
  }

  private handleEditCancel = (_viewContext: ViewContext, id: string | undefined) => {
    this.getCurrentPanel().panelWillDisappear()
    const context = this.state.store.popContext()
    this.getCurrentPanel().panelWillAppear()

    switch (context.type) {
      case PanelType.Edit:
        context.result.resolve(id)
        break
    }

    // TODO: Move outside of PanelManager
    if (this.state.store.contexts.length === 1) {
      const context = this.state.store.contexts[0] as ListPanelContext
      this.props.applicationStore.locationStore.pushLocation(
        EntryListLocation(context.viewContext.slug || context.viewContext.model), false
      )
    }
  }

  private handlePostSave = (viewContext: ViewContext, id: string) => {
    // TODO: Move outside of PanelManager
    if (this.state.store.contexts.length === 2) {
      this.props.applicationStore.locationStore.replaceLocation(
        EntryEditLocation(viewContext.slug || viewContext.model, id), false
      )
    }
  }

  private handleEditorSave = (data: any) => {
    this.getCurrentPanel().panelWillDisappear()
    const context = this.state.store.popContext()
    this.getCurrentPanel().panelWillAppear()

    switch (context.type) {
      case PanelType.Editor: return context.result.resolve(data)
    }
  }

  private handleOpenEditor = (store: FieldStore) => {
    const context = EditorPanelContext(store)
    this.state.store.pushContext(context)

    return context.result
  }

  private handleOpenJSONEditor = (data: any) => {
    const context = JSONEditorPanelContext(data)
    this.state.store.pushContext(context)

    return context.result
  }

  private handleJSONApply = (data: any) => {
    this.getCurrentPanel().panelWillDisappear()
    const context = this.state.store.popContext()
    this.getCurrentPanel().panelWillAppear()

    switch (context.type) {
      case PanelType.JSONEditor: return context.result.resolve(data)
    }
  }

  private handlePanelRef = (contextID: string, component: PanelComponent | null) => {
    if (component) {
      this.panelComponents.set(contextID, component)
    } else {
      this.panelComponents.delete(contextID)
    }
  }

  public render() {
    return (
      <StackView>
       {this.state.store.contexts.map((context, index) => {
        const isDisabled = index !== this.state.store.contexts.length - 1

        switch (context.type) {
          case PanelType.List: return (
            <EntryListPanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              viewContext={context.viewContext}
              onEntryChoose={this.handleEntryChoose}
              onEntryEdit={this.handleEntryEdit}
              onEntryDelete={this.handleEntryDelete}
              onNewEntry={this.handleEntryEdit}
              disabled={isDisabled} />
          )

          case PanelType.ChooseList: return (
            <ChooseEntryListPanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              viewContext={context.viewContext}
              onEntryChoose={this.handleEntryChoose}
              onEntryChosen={this.handleEntryChosen}
              disabled={isDisabled} />
          )

          case PanelType.Edit: return (
            <EntryEditPanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              viewContext={context.viewContext}
              id={context.id}
              disabled={isDisabled}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              onCancel={this.handleEditCancel}
              onChooseEntry={this.handleEntryChoose}
              onEditEntry={this.handleEntryEdit}
              onPostSave={this.handlePostSave}
              onOpenEditor={this.handleOpenEditor}
              onOpenJSONEditor={this.handleOpenJSONEditor} />
          )

          case PanelType.Editor: return (
            <EditorPanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              store={context.fieldStore}
              disabled={isDisabled}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              onCancel={this.handleCancel}
              onChooseEntry={this.handleEntryChoose}
              onEditEntry={this.handleEntryEdit}
              onSave={this.handleEditorSave}
              onOpenEditor={this.handleOpenEditor} />
          )

          case PanelType.Delete: return (
            <EntryDeletePanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              viewContext={context.viewContext}
              id={context.id}
              disabled={isDisabled}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              onCancel={this.handleCancel}
              onPostDelete={this.handleCancel}
              onDoubleClickEntry={this.handleEntryEdit} />
          )

          case PanelType.JSONEditor: return (
            <JSONEditorPanel key={context.contextID}
              ref={(component) => this.handlePanelRef(context.contextID, component)}
              data={context.data}
              disabled={isDisabled}
              editorStore={this.props.applicationStore.editorStore}
              notificationStore={this.props.applicationStore.notificationStore}
              onCancel={this.handleCancel}
              onApply={this.handleJSONApply} />
          )
        }
      })}
      </StackView>
    )
  }
}