import * as React from 'react'

import {observer} from 'mobx-react'

import {FlexList, Button, ButtonType} from '../ui/common'

import {renderRootValueStore, DataCallbackFn} from '../ui/fields/renderFieldStore'
import {FieldStore} from '../store/fields/fieldStore'

import {Entry} from '../api/karma'
import {EditorStore} from '../store/editorStore'
import {ObjectMap} from '@karma.run/editor-common'
import {Panel} from '../ui/common/panel'
import {PanelToolbar} from '../ui/common/panel/toolbar'
import {PanelContent} from '../ui/common/panel/content'
import {ViewContext} from '../api/karmafe/viewContext'
import {PanelHeader} from '../ui/common/panel/header'
import {IconName} from '../ui/common/icon'
import {PanelComponent} from './panelManager'
import {NotificationType} from '../context/notification'

export namespace EditorPanel {
  export interface Props {
    disabled: boolean
    editorStore: EditorStore
    store: FieldStore
    notificationStore: any
    onEditEntry: (viewContext: ViewContext, id: string | undefined) => Promise<string | undefined>
    onChooseEntry: (viewContext: ViewContext) => Promise<string | undefined>
    onOpenEditor: (store: FieldStore) => Promise<any>
    onCancel: () => void
    onSave: (data: any) => void
  }

  export interface State {
    isSaving: boolean
  }
}

@observer
export class EditorPanel extends React.Component<EditorPanel.Props, EditorPanel.State>
  implements PanelComponent {
  private loadingEntries: ObjectMap<Promise<Entry> | undefined> = {}

  public state: EditorPanel.State = {
    isSaving: false
  }

  public panelWillAppear() {}
  public panelWillDisappear() {}

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

  private handleEntryEditDelegate = async (
    model: string,
    id: string | undefined,
    done: (id?: string) => void
  ) => {
    done(await this.props.onEditEntry(this.props.editorStore.viewContextMap[model]!, id))
  }

  private handleCancel = () => {
    this.props.onCancel()
  }

  private handleSave = async () => {
    if (this.props.store.validate()) {
      this.setState({isSaving: true})

      try {
        if (this.props.store.onSave) await this.props.store.onSave(false)
        const value = await this.props.store.asJS()

        this.setState({isSaving: false})
        this.props.onSave(value)
      } catch (err) {
        this.props.notificationStore.notify({
          message: `Error while saving: ${err.message}`,
          type: NotificationType.Error
        })

        this.setState({isSaving: false})
      }
    } else {
      this.props.notificationStore.notify({
        message: `Fix all validation erros.`,
        type: NotificationType.Error
      })
    }
  }
  private handleChooseEntryDelegate = async (model: string, done: (id?: string) => void) => {
    done(await this.props.onChooseEntry(this.props.editorStore.viewContextMap[model]!))
  }

  private handleOpenEditor = async (store: FieldStore, done: DataCallbackFn) => {
    done(await this.props.onOpenEditor(store))
  }

  public render(): JSX.Element {
    const disabled = this.props.disabled || this.state.isSaving

    const buttons = (
      <FlexList spacing="large">
        <Button
          type={ButtonType.Icon}
          icon={IconName.Back}
          onTrigger={this.handleCancel}
          disabled={disabled}
          label="Back"
        />
        <Button
          type={ButtonType.Icon}
          icon={IconName.SaveDocument}
          onTrigger={this.handleSave}
          disabled={disabled}
          label="Apply"
        />
      </FlexList>
    )

    return (
      <Panel>
        <PanelHeader title="Edit / Data" />
        <PanelToolbar left={buttons} />
        <PanelContent>
          {renderRootValueStore(this.props.store, {
            onLoadEntry: this.handleEntryLoadDelegate,
            onEditEntry: this.handleEntryEditDelegate,
            onChooseEntry: this.handleChooseEntryDelegate,
            onOpenEditor: this.handleOpenEditor,
            viewContextMap: this.props.editorStore.viewContextMap,
            reverseTags: this.props.editorStore.reverseTags,
            disabled,
            isWrapped: true,
            index: 0,
            depth: 0
          })}
        </PanelContent>
      </Panel>
    )
  }
}
