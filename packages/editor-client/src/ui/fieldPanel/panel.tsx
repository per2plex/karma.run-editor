import React from 'react'
import memoizeOne from 'memoize-one'
import {Ref} from '@karma.run/sdk'

import {
  Panel,
  SessionContext,
  withSession,
  ModelRecord,
  PanelContent,
  withLocale,
  LocaleContext,
  PanelToolbar,
  IconName,
  ButtonType,
  Button,
  FlexList,
  Field,
  PanelHeader
} from '@karma.run/editor-common'

export interface FieldPanelProps {
  value?: any
  field: Field
  sessionContext: SessionContext
  localeContext: LocaleContext
  disabled: boolean
  onBack: (value?: any) => void
  onApply: (value: any) => void
  onEditRecord: (model: Ref, id?: Ref) => Promise<ModelRecord | undefined>
  onSelectRecord: (model: Ref) => Promise<ModelRecord | undefined>
}

export interface FieldPanelState {
  isSaving: boolean
  isLoadingRecord: boolean
  hasUnsavedChanges: boolean
  value: any
}

export class FieldPanel extends React.PureComponent<FieldPanelProps, FieldPanelState> {
  public state: FieldPanelState = {
    isSaving: false,
    isLoadingRecord: false,
    hasUnsavedChanges: false,
    value: undefined
  }

  private handleValueChange = (value: any) => {
    this.setState({
      hasUnsavedChanges: true,
      value
    })
  }

  private handleBack = () => {
    this.props.onBack()
  }

  private handleApply = async () => {
    this.props.onApply(this.state.value || this.props.value || this.props.field.defaultValue)
  }

  private getToolbarButtons = memoizeOne((disabled: boolean) => {
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
          onTrigger={this.handleApply}
          disabled={disabled}
          label="Apply"
        />
      </FlexList>
    )
  })

  public render() {
    const _ = this.props.localeContext.get
    const disabled = this.state.isSaving || this.props.disabled

    return (
      <Panel>
        <PanelHeader title={_('editTitle')} />
        <PanelToolbar left={this.getToolbarButtons(disabled)} />
        <PanelContent>
          {this.props.field.renderEditComponent({
            depth: 0,
            index: 0,
            isWrapped: true,
            disabled: disabled,
            value: this.props.value || this.state.value || this.props.field.defaultValue,
            onValueChange: this.handleValueChange,
            onEditRecord: this.props.onEditRecord,
            onSelectRecord: this.props.onSelectRecord
          })}
        </PanelContent>
      </Panel>
    )
  }
}

export const FieldPanelContainer = withLocale(withSession(FieldPanel))