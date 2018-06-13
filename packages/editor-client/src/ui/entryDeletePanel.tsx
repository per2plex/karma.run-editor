import * as React from 'react'

import {observer} from 'mobx-react'

import {EditorStore} from '../store/editorStore'
import {ViewContext} from '../api/karmafe/viewContext'

import {Button, ButtonType, FlexList} from '../ui/common'
import {FieldStore} from '../store/fields/fieldStore'
import {createFieldStoreForViewContextAndFill} from '../store/fields/createFromViewContext'
import {CenteredLoadingIndicator} from '../ui/common/loader'
import {NotificationStore, NotificationType} from '../store/notificationStore'
import {APIError, Entry} from '../api/karma'
import {Panel} from '../ui/common/panel'
import {ViewContextPanelHeader} from '../ui/common/panel/viewContextHeader'
import {PanelToolbar} from '../ui/common/panel/toolbar'
import {IconName} from '../ui/common/icon'
import {GraphView} from './common/graphView'
import {PanelComponent} from './panelManager'

export namespace EntryDeletePanel {
  export interface Props {
    disabled: boolean
    viewContext: ViewContext
    id: string
    editorStore: EditorStore
    notificationStore: NotificationStore
    onDoubleClickEntry: (viewContext: ViewContext, id: string) => void
    onPostDelete: (viewContext: ViewContext, id: string) => void
    onCancel: (viewContext: ViewContext, id: string) => void
  }

  export interface State {
    entry?: Entry
    store?: FieldStore
  }
}

@observer
export class EntryDeletePanel
  extends React.Component<EntryDeletePanel.Props, EntryDeletePanel.State>
  implements PanelComponent {
  public state: EntryDeletePanel.State = {}
  private graphView: GraphView | null = null

  public async componentWillMount() {
    const entry = await this.props.editorStore.loadEntryForID(
      this.props.viewContext.model,
      this.props.id
    )

    this.setState({
      entry,
      store: createFieldStoreForViewContextAndFill(this.props.viewContext, entry.value)
    })
  }

  public panelWillAppear() {
    this.graphView!.reload()
  }

  public panelWillDisappear() {}

  private handleDeleteClick = async () => {
    if (this.state.store!.onDelete) await this.state.store!.onDelete!()

    try {
      await this.props.editorStore.deleteEntry(this.props.viewContext.model, this.props.id)

      this.props.onPostDelete(this.props.viewContext, this.props.id)
    } catch (err) {
      const apiError = err as APIError
      this.props.notificationStore.notify({
        message: apiError.response!.data.message,
        type: NotificationType.Error
      })
    }
  }

  private handleCancel = () => {
    this.props.onCancel(this.props.viewContext, this.props.id)
  }

  private handleNodeDoubleClick = (model: string, id: string) => {
    this.props.onDoubleClickEntry(this.props.editorStore.viewContextMap[model]!, id)
  }

  public render() {
    if (!this.state.store) return <CenteredLoadingIndicator />

    const disabled = this.props.disabled

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={this.props.viewContext} prefix="Delete" />
        <PanelToolbar
          left={
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
                icon={IconName.DeleteDocument}
                label="Delete"
                onTrigger={this.handleDeleteClick}
              />
            </FlexList>
          }
        />
        {this.state.entry && (
          <GraphView
            ref={graphView => (this.graphView = graphView)}
            entry={this.state.entry}
            editorStore={this.props.editorStore}
            viewContext={this.props.viewContext}
            onNodeDoubleClick={this.handleNodeDoubleClick}
          />
        )}
      </Panel>
    )
  }
}
