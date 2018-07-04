import React from 'react'
import {Ref, MetarializedRecord} from '@karma.run/sdk'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession} from '../../context/session'
import {ViewContext} from '../../api/newViewContext'
import {PanelContent} from '../common/panel/content'
import {withLocale, LocaleContext} from '../../context/locale'

export interface RecordEditPanelProps {
  recordID?: Ref
  model: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  onNewRecord: (model: Ref) => void
  onEditRecord: (id: Ref) => void
}

export interface RecordEditPanelState {
  record: MetarializedRecord
  value: any
}

export class RecordEditPanel extends React.Component<RecordEditPanelProps, RecordEditPanelState> {
  public state: RecordEditPanelState = {}

  private handleNew = () => {
    this.props.onNewRecord(this.props.recordID)
  }

  private handleValueChange = (value: any) => {
    this.setState({value})
  }

  private get viewContext(): ViewContext | undefined {
    return this.props.sessionContext.viewContextMap.get(this.props.model)
  }

  public render() {
    const sessionContext = this.props.sessionContext
    const viewContext = this.viewContext
    const _ = this.props.localeContext.get

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader viewContext={viewContext} prefix={_('editRecordPrefix')} />
        <PanelContent>
          {viewContext.field.renderEditComponent({
            depth: 0,
            index: 0,
            isWrapped: true,
            disabled: this.props.disabled,
            value: this.state.value || viewContext.field.defaultValue(),
            onChange: this.handleValueChange
          })}
        </PanelContent>
      </Panel>
    )
  }
}

export const RecordEditPanelContainer = withLocale(withSession(RecordEditPanel))
