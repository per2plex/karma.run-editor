import * as React from 'react'
import { observer } from 'mobx-react'

import { FlexList, Button, ButtonType } from '../ui/common'

import { renderRootValueStore, DataCallbackFn } from '../ui/fields/renderFieldStore'
import { FieldStore } from '../store/fields/fieldStore'

import {
  createFieldStoreForViewContextAndFill,
  createFieldStoreForViewContext
} from '../store/fields/createFromViewContext'

import { Entry } from '../api/karma'
import { CenteredLoadingIndicator } from '../ui/common/loader'
import { EditorStore } from '../store/editorStore'
import { ObjectMap } from '@karma.run/editor-common'
import { ViewContextPanelHeader } from '../ui/common/panel/viewContextHeader'
import { Panel } from '../ui/common/panel'
import { PanelToolbar } from '../ui/common/panel/toolbar'
import { PanelContent } from '../ui/common/panel/content'
import { ViewContext } from '../api/karmafe/viewContext'
import { NotificationStore, NotificationType } from '../store/notificationStore'
import { IconName } from '../ui/common/icon'
import { reaction, IReactionDisposer } from 'mobx'
import { PanelComponent } from './panelManager'

export namespace EntryEditPanel {
  export interface Props {
    id: string | undefined
    viewContext: ViewContext
    disabled: boolean
    editorStore: EditorStore
    notificationStore: NotificationStore
    onEditEntry: (viewContext: ViewContext, id: string | undefined) => Promise<string | undefined>
    onChooseEntry: (viewContext: ViewContext) => Promise<string | undefined>
    onOpenEditor: (store: FieldStore) => Promise<any>
    onOpenJSONEditor: (data: any) => Promise<any>
    onCancel: (viewContext: ViewContext, id: string | undefined) => void
    onPostSave: (viewContext: ViewContext, id: string) => void
  }

  export interface State {
    isSaving: boolean
    hasUnsavedChanges: boolean
    store?: FieldStore
  }
}

@observer
export class EntryEditPanel extends React.Component<EntryEditPanel.Props, EntryEditPanel.State>
  implements PanelComponent {
  private loadingEntries: ObjectMap<Promise<Entry> | undefined> = {}
  private entryID: string | undefined

  private disposeHashReaction?: IReactionDisposer

  constructor(props: EntryEditPanel.Props) {
    super(props)

    this.state = {
      isSaving: false,
      hasUnsavedChanges: false
    }
  }

  public async componentWillMount() {
    let value: any

    if (this.props.id) {
      const entry = await this.props.editorStore.loadEntryForID(
        this.props.viewContext.model, this.props.id
      )

      value = entry.value
    }

    const store = this.props.id
      ? createFieldStoreForViewContextAndFill(this.props.viewContext, value)
      : createFieldStoreForViewContext(this.props.viewContext)

    this.entryID = this.props.id
    this.setState({store})

    this.disposeHashReaction = reaction(() => {
      return store.hash
    }, () => {
      if (!this.state.hasUnsavedChanges) {
        this.props.editorStore.increaseUnsavedChangesCount()
        this.setState({hasUnsavedChanges: true})
      }
    })
  }

  public componentWillUnmount() {
    if (this.disposeHashReaction) this.disposeHashReaction()
    if (this.state.hasUnsavedChanges) this.props.editorStore.decreaseUnsavedChangesCount()
  }

  private handleEntryLoadDelegate = (model: string, id: string) => {
    const key = `${model}/${id}`
    const cleanup = () => delete this.loadingEntries[key]

    let promise = this.loadingEntries[key]
    if (promise) return promise

    promise = this.props.editorStore.loadEntryForID(model, id)
    promise.then(cleanup, cleanup)

    this.loadingEntries[key] = promise

    return promise
  }

  public panelWillAppear() {}
  public panelWillDisappear() {}

  private handleEntryEditDelegate = async (
    model: string, id: string | undefined, done: (id?: string) => void
  ) => {
    done(await this.props.onEditEntry(this.props.editorStore.viewContextMap[model]!, id))
  }

  private handleCancel = () => {
    let confirmed = true

    if (this.state.hasUnsavedChanges) {
      confirmed = window.confirm('You have unsaved changes, are you sure you want to go back?')
    }

    if (confirmed) {
      if (this.state.hasUnsavedChanges) {
        this.props.editorStore.decreaseUnsavedChangesCount()
        this.setState({hasUnsavedChanges: false}, () => {
          this.props.onCancel(this.props.viewContext, this.entryID)
        })
      } else {
        this.props.onCancel(this.props.viewContext, this.entryID)
      }
    }
  }

  private async save(id?: string) {
    if (this.state.store && this.state.store.validate()) {
      let entryID: string

      this.setState({isSaving: true})

      try {
        if (this.state.store.onSave) await this.state.store.onSave(id ? false : true)
        const value = await this.state.store.asJS()

        if (!id) {
          entryID = await this.props.editorStore.createEntry(this.props.viewContext.model, value)
        } else {
          entryID = await this.props.editorStore.updateEntry(this.props.viewContext.model, id, value)
        }

        if (this.state.hasUnsavedChanges) {
          this.props.editorStore.decreaseUnsavedChangesCount()
        }

        this.entryID = entryID
        this.setState({isSaving: false, hasUnsavedChanges: false}, () => {
          this.props.onPostSave(this.props.viewContext, entryID)
        })

        if (!id) {
          this.props.notificationStore.notify({
            message: 'Saved as copy!',
            type: NotificationType.Success
          })
        }
      } catch (err) {
        this.props.notificationStore.notify({
          message: `Error while saving: ${err.message}`,
          type: NotificationType.Error
        })

        this.setState({isSaving: false})
      }
    } else {
      this.props.notificationStore.notify({
        message: 'Fix all validation erros.',
        type: NotificationType.Error
      })
    }
  }

  private handleSave = async () => {
    this.save(this.entryID)
  }

  private handleSaveAsCopy = async () => {
    this.save()
  }

  private handleChooseEntryDelegate = async (model: string, done: (id?: string) => void) => {
    done(await this.props.onChooseEntry(this.props.editorStore.viewContextMap[model]!))
  }

  private handleOpenEditor = async (store: FieldStore, done: DataCallbackFn) => {
    done(await this.props.onOpenEditor(store))
  }

  private handleOpenJSONEditor = async () => {
    if (!this.state.store) return

    const value = await this.state.store.asJS()
    const newValue = await this.props.onOpenJSONEditor(value)

    if (this.state.store.fits(newValue)) {
      this.state.store.fill(newValue)
    } else {
      this.props.notificationStore.notify({
        message: "JSON data doesn't fit model!",
        type: NotificationType.Error
      })
    }
  }

  public render(): JSX.Element {
    let devButton: React.ReactNode

    if (this.props.editorStore.isDeveloper) {
      devButton = (
        <Button icon={IconName.CodeView}
          type={ButtonType.Icon}
          onTrigger={this.handleOpenJSONEditor} />
      )
    }

    const disabled = this.props.disabled || this.state.isSaving

    let content: React.ReactNode

    if (!this.state.store) {
      content = <CenteredLoadingIndicator />
    } else {
      content = renderRootValueStore(this.state.store, {
        onLoadEntry: this.handleEntryLoadDelegate,
        onEditEntry: this.handleEntryEditDelegate,
        onChooseEntry: this.handleChooseEntryDelegate,
        onOpenEditor: this.handleOpenEditor,
        viewContextMap: this.props.editorStore.viewContextMap,
        reverseTags: this.props.editorStore.reverseTags,
        disabled,
        isWrapped: true,
        depth: 0,
        index: 0
      })
    }

    const buttons = (
      <FlexList spacing='large'>
        <Button type={ButtonType.Icon}
          icon={IconName.Back}
          onTrigger={this.handleCancel}
          disabled={disabled}
          label='Back' />
        <Button type={ButtonType.Icon}
          icon={IconName.SaveDocument}
          onTrigger={this.handleSave}
          disabled={disabled || !this.state.hasUnsavedChanges}
          label='Save' />
        <Button type={ButtonType.Icon}
          icon={IconName.CopyDocument}
          onTrigger={this.handleSaveAsCopy}
          disabled={disabled}
          label='Save as Copy' />
      </FlexList>
    )

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={this.props.viewContext} prefix='Edit' />
        <PanelToolbar left={buttons} right={devButton} />
        <PanelContent>
          {content}
        </PanelContent>
      </Panel>
    )
  }
}
