import React from 'react'
import {Ref, MetarializedRecord} from '@karma.run/sdk'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession} from '../../context/session'
import {PanelContent} from '../common/panel/content'
import {withLocale, LocaleContext} from '../../context/locale'
import {PanelToolbar} from '../common/panel/toolbar'
import {IconName} from '../common/icon'
import {ButtonType, Button} from '../common/button'
import {FlexList} from '../common'
import {CenteredLoadingIndicator} from '../common/loader'
import memoizeOne from 'memoize-one'

export interface RecordEditPanelProps {
  recordID?: Ref
  model: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  onCancel: (model: Ref, id?: Ref) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<Ref | undefined>
  onChooseRecord: (model: Ref, id?: Ref) => Promise<Ref | undefined>
}

export interface RecordEditPanelState {
  record?: MetarializedRecord
  isLoadingRecord: boolean
  hasUnsavedChanges: boolean
  value?: any
}

export class RecordEditPanel extends React.PureComponent<
  RecordEditPanelProps,
  RecordEditPanelState
> {
  public state: RecordEditPanelState = {
    isLoadingRecord: false,
    hasUnsavedChanges: false
  }

  private async loadRecord(id: Ref) {
    this.setState({
      isLoadingRecord: true
    })

    this.setState({
      isLoadingRecord: false,
      record: await this.props.sessionContext.getRecord(this.props.model, id)
    })
  }

  private handleValueChange = (value: any) => {
    this.setState({value})
  }

  private handleCancel = () => {
    this.props.onCancel(this.props.model, this.props.recordID)
  }

  private handleEditRecord = () => {}

  private handleSave = async () => {
    this.setState({
      value: undefined,
      record: await this.props.sessionContext.saveRecord(
        this.props.model,
        this.props.recordID,
        this.state.value
      )
    })
  }

  private handleSaveAsCopy = async () => {
    this.setState({
      value: undefined,
      record: await this.props.sessionContext.saveRecord(
        this.props.model,
        undefined,
        this.state.value
      )
    })
  }

  private handleOpenJSONEditor = () => {}

  public componentDidMount() {
    if (this.props.recordID) this.loadRecord(this.props.recordID)
  }

  private getToolbarButtons = memoizeOne((disabled: boolean, hasChanges: boolean) => {
    return (
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
          disabled={disabled || !hasChanges}
          label="Save"
        />
        <Button
          type={ButtonType.Icon}
          icon={IconName.CopyDocument}
          onTrigger={this.handleSaveAsCopy}
          disabled={disabled}
          label="Save as Copy"
        />
      </FlexList>
    )
  })

  private getDeveloperButtons = memoizeOne((isDeveloper: boolean) => {
    if (!isDeveloper) return undefined

    return (
      <Button
        icon={IconName.CodeView}
        type={ButtonType.Icon}
        onTrigger={this.handleOpenJSONEditor}
      />
    )
  })

  public render() {
    const viewContext = this.props.sessionContext.viewContextMap.get(this.props.model)
    const disabled = this.props.disabled
    const _ = this.props.localeContext.get

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader
          viewContext={viewContext}
          prefix={this.props.recordID ? _('editRecordPrefix') : _('newRecordPrefix')}
        />
        <PanelToolbar
          left={this.getToolbarButtons(this.props.disabled, this.state.value != undefined)}
          right={this.getDeveloperButtons(true)} // TODO: Developer mode
        />
        <PanelContent>
          {this.state.isLoadingRecord ? (
            <CenteredLoadingIndicator />
          ) : (
            viewContext.field.renderEditComponent({
              depth: 0,
              index: 0,
              isWrapped: true,
              disabled: this.props.disabled,
              value:
                this.state.value ||
                (this.state.record ? this.state.record.value : viewContext.field.defaultValue()),
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord
            })
          )}
        </PanelContent>
      </Panel>
    )
  }
}

export const RecordEditPanelContainer = withLocale(withSession(RecordEditPanel))
