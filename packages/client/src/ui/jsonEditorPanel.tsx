import * as React from 'react'

import { observer } from 'mobx-react'

import { EditorStore } from '../store/editorStore'

import { FlexList, Button, ButtonType } from '../ui/common'
import { NotificationStore, NotificationType } from '../store/notificationStore'
import { Panel } from '../ui/common/panel'
import { PanelToolbar } from '../ui/common/panel/toolbar'
import { PanelHeader } from '../ui/common/panel/header'
import { Spacing } from '../ui/style'
import { IconName } from '../ui/common/icon'
import { PanelComponent } from './panelManager'

export namespace JSONEditorPanel {
  export interface Props {
    disabled: boolean
    data: any
    editorStore: EditorStore
    notificationStore: NotificationStore
    onApply: (data: any) => void
    onCancel: () => void
  }

  export interface State {
    value: string
  }
}

@observer
export class JSONEditorPanel extends React.Component<JSONEditorPanel.Props, JSONEditorPanel.State>
  implements PanelComponent {
  constructor(props: JSONEditorPanel.Props) {
    super(props)
    this.state = {value: JSON.stringify(props.data, undefined, 2)}
  }

  public panelWillAppear() {}
  public panelWillDisappear() {}

  private handleCancel = () => {
    this.props.onCancel()
  }

  private handleApply = () => {
    try {
      const data = JSON.parse(this.state.value)
      this.props.onApply(data)
    } catch (e) {
      this.props.notificationStore.notify({
        message: e.message,
        type: NotificationType.Error
      })
    }
  }

  private handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({value: e.currentTarget.value})
  }

  public render() {
    const disabled = this.props.disabled

    const buttons = (
      <FlexList spacing='large'>
        <Button type={ButtonType.Icon}
          icon={IconName.Close}
          onTrigger={this.handleCancel}
          disabled={disabled}
          label='Cancel' />
        <Button type={ButtonType.Icon}
          icon={IconName.SaveDocument}
          onTrigger={this.handleApply}
          disabled={disabled}
          label='Apply' />
      </FlexList>
    )

    return (
      <Panel>
        <PanelHeader title='Edit / JSON' />
        <PanelToolbar left={buttons} />
        <div style={{flexGrow: 1, display: 'flex', flexDirection: 'column', padding: Spacing.medium}}>
          <textarea style={{width: '100%', flexGrow: 1}}
            onChange={this.handleChange}
            value={this.state.value} />
        </div>
      </Panel>
    )
  }
}
