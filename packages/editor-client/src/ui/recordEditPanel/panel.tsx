import React from 'react'
import {Ref} from '@karma.run/sdk'

import {Panel} from '../common/panel'
import {ViewContextPanelHeader} from '../common/panel/viewContextHeader'
import {SessionContext, withSession, ModelRecord} from '../../context/session'
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
  onBack: (model: Ref, record?: ModelRecord) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<ModelRecord | undefined>
  onSelectRecord: (model: Ref) => Promise<ModelRecord | undefined>
}

export interface RecordEditPanelState {
  record?: ModelRecord
  isSaving: boolean
  isLoadingRecord: boolean
  hasUnsavedChanges: boolean
  value?: any
}

export class RecordEditPanel extends React.PureComponent<
  RecordEditPanelProps,
  RecordEditPanelState
> {
  public state: RecordEditPanelState = {
    isSaving: false,
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

  private handleBack = () => {
    this.props.onBack(this.props.model, this.state.record)
  }

  private handleSave = async () => {
    this.setState({
      isSaving: true
    })

    this.setState({
      isSaving: false,
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
      isSaving: true
    })

    this.setState({
      isSaving: false,
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
          onTrigger={this.handleBack}
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
    const _ = this.props.localeContext.get
    const disabled = this.state.isSaving || this.props.disabled
    const viewContext = this.props.sessionContext.viewContextMap.get(this.props.model)

    // TODO: Error panel
    if (!viewContext) return <div>Not Found</div>

    return (
      <Panel>
        <ViewContextPanelHeader
          viewContext={viewContext}
          prefix={
            this.props.recordID || this.state.record ? _('editRecordPrefix') : _('newRecordPrefix')
          }
        />
        <PanelToolbar
          left={this.getToolbarButtons(disabled, this.state.value != undefined)}
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
              disabled: disabled,
              value:
                this.state.value ||
                (this.state.record ? this.state.record.value : viewContext.field.defaultValue),
              onValueChange: this.handleValueChange,
              onEditRecord: this.props.onEditRecord,
              onSelectRecord: this.props.onSelectRecord
            })
          )}
        </PanelContent>
      </Panel>
    )
  }
}

export const RecordEditPanelContainer = withLocale(withSession(RecordEditPanel))
