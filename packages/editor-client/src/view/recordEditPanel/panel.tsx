import React from 'react'
import memoizeOne from 'memoize-one'
import {Ref} from '@karma.run/sdk'

import {
  Panel,
  ViewContextPanelHeader,
  PanelContent,
  PanelToolbar,
  IconName,
  ButtonType,
  Button,
  FlexList,
  CenteredLoadingIndicator
} from '../../ui'

import {AnyField} from '../../api/field'
import {SessionContext, ModelRecord, withSession} from '../../context/session'
import {LocaleContext, withLocale} from '../../context/locale'
import {NotificationContext, withNotification, NotificationType} from '../../context/notification'

export interface RecordEditPanelProps {
  recordID?: Ref
  model: Ref
  sessionContext: SessionContext
  localeContext: LocaleContext
  notificationContext: NotificationContext
  disabled: boolean
  onBack: (model: Ref, record?: ModelRecord) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<ModelRecord | undefined>
  onSelectRecord: (model: Ref) => Promise<ModelRecord | undefined>
  onEditField: (field: AnyField, value?: any) => Promise<any>
  onPostSave: (model: Ref, id: Ref) => void
}

export interface RecordEditPanelState {
  record?: ModelRecord
  isSaving: boolean
  isLoadingRecord: boolean
  hasUnsavedChanges: boolean
  value: any
}

export class RecordEditPanel extends React.PureComponent<
  RecordEditPanelProps,
  RecordEditPanelState
> {
  public state: RecordEditPanelState = {
    isSaving: false,
    isLoadingRecord: false,
    hasUnsavedChanges: false,
    value: undefined
  }

  private async loadRecord(id: Ref) {
    this.setState({
      isLoadingRecord: true
    })

    const record = await this.props.sessionContext.getRecord(this.props.model, id)

    this.setState({
      isLoadingRecord: false,
      hasUnsavedChanges: false,
      record,
      value: record.value
    })
  }

  private handleValueChange = (value: any) => {
    if (!this.state.hasUnsavedChanges) {
      this.props.sessionContext.increaseUnsavedChangesCount()
    }

    this.setState({
      hasUnsavedChanges: true,
      value
    })
  }

  private handleBack = () => {
    let confirmed = true

    if (this.state.hasUnsavedChanges) {
      confirmed = window.confirm('You have unsaved changes, are you sure you want to go back?')
    }

    if (confirmed) {
      if (this.state.hasUnsavedChanges) {
        this.props.sessionContext.decreaseUnsavedChangesCount()
      }

      this.props.onBack(this.props.model, this.state.record)
    }
  }

  private handleSave = async () => {
    this.setState({isSaving: true})

    try {
      const record = await this.props.sessionContext.saveRecord(
        this.props.model,
        this.state.record && this.state.record.id,
        this.state.value
      )

      this.props.notificationContext.notify({
        type: NotificationType.Success,
        message: 'Successfully saved!'
      })

      this.props.onPostSave(this.props.model, record.id)
      this.props.sessionContext.decreaseUnsavedChangesCount()

      this.setState({
        isSaving: false,
        hasUnsavedChanges: false,
        record: record,
        value: record.value
      })
    } catch (err) {
      console.error(err)
      this.props.notificationContext.notify({type: NotificationType.Error, message: err.message})
      this.setState({isSaving: false})
    }
  }

  private handleSaveAsCopy = async () => {
    this.setState({isSaving: true})

    try {
      const record = await this.props.sessionContext.saveRecord(
        this.props.model,
        undefined,
        this.state.value
      )

      this.props.notificationContext.notify({
        type: NotificationType.Success,
        message: 'Successfully saved as copy!'
      })

      this.props.onPostSave(this.props.model, record.id)

      if (this.state.hasUnsavedChanges) {
        this.props.sessionContext.decreaseUnsavedChangesCount()
      }

      this.setState({
        isSaving: false,
        hasUnsavedChanges: false,
        record: record,
        value: record.value
      })
    } catch (err) {
      console.error(err)
      this.props.notificationContext.notify({type: NotificationType.Error, message: err.message})
      this.setState({isSaving: false})
    }
  }

  // private handleOpenJSONEditor = () => {}

  public componentDidMount() {
    if (this.props.recordID) this.loadRecord(this.props.recordID)
  }

  private getToolbarButtons = memoizeOne(
    (
      disabled: boolean,
      hasChanges: boolean,
      isNewRecord: boolean,
      localeContext: LocaleContext
    ) => {
      const _ = localeContext.get

      return (
        <FlexList spacing="large">
          <Button
            type={ButtonType.Icon}
            icon={IconName.Back}
            onTrigger={this.handleBack}
            disabled={disabled}
            label={_('back')}
          />
          <Button
            type={ButtonType.Icon}
            icon={IconName.SaveDocument}
            onTrigger={this.handleSave}
            disabled={disabled || !hasChanges}
            label={_('save')}
          />
          {!isNewRecord && (
            <Button
              type={ButtonType.Icon}
              icon={IconName.CopyDocument}
              onTrigger={this.handleSaveAsCopy}
              disabled={disabled}
              label={_('saveAsCopy')}
            />
          )}
        </FlexList>
      )
    }
  )

  private getDeveloperButtons = memoizeOne(
    (_isDeveloper: boolean, _localeContext: LocaleContext) => {
      return null

      // TODO: Expression Editor
      // if (!isDeveloper) return undefined
      // const _ = localeContext.get

      // return (
      //   <Button
      //     label={_('expressionEditor')}
      //     icon={IconName.CodeView}
      //     type={ButtonType.Icon}
      //     onTrigger={this.handleOpenJSONEditor}
      //   />
      // )
    }
  )

  public render() {
    const _ = this.props.localeContext.get
    const disabled = this.state.isSaving || this.props.disabled
    const isNewRecord = this.props.recordID == undefined && this.state.record == undefined
    const hasUnsavedChanges = this.props.recordID == undefined || this.state.hasUnsavedChanges
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
          left={this.getToolbarButtons(
            disabled,
            hasUnsavedChanges,
            isNewRecord,
            this.props.localeContext
          )}
          right={this.getDeveloperButtons(
            this.props.sessionContext.developmentMode,
            this.props.localeContext
          )}
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
              onSelectRecord: this.props.onSelectRecord,
              onEditField: this.props.onEditField
            })
          )}
        </PanelContent>
      </Panel>
    )
  }
}

export const RecordEditPanelContainer = withNotification(withLocale(withSession(RecordEditPanel)))
