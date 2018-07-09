import React from 'react'
import {style} from 'typestyle'
import {expression as e, data as d, Ref} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {
  SerializedField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps
} from './interface'

import {Field as FieldComponent, FieldLabel} from '../ui/common/field'
import {CardSection, Card, CardFooter} from '../ui/common/card'
import {SortConfiguration, FilterConfiguration} from '../filter/configuration'
import {withSession, SessionContext, ModelRecord} from '../context/session'
import {LocaleContext, withLocale} from '../context/locale'
import {LoadingIndicator, LoadingIndicatorStyle} from '../ui/common/loader'
import {DescriptionView} from '../ui/common/descriptionView'
import {Button, ButtonType} from '../ui/common/button'
import {IconName} from '../ui/common/icon'
import {Spacing} from '../ui/style'
import {convertKeyToLabel} from '../util/string'

export interface RefFieldEditComponentProps
  extends EditComponentRenderProps<RefField, RefFieldValue> {
  sessionContext: SessionContext
  localeContext: LocaleContext
}

export interface RefFieldEditComponentState {
  isLoadingRecord?: boolean
  record?: ModelRecord
}

export class RefFieldEditComponent extends React.PureComponent<
  RefFieldEditComponentProps,
  RefFieldEditComponentState
> {
  public state: RefFieldEditComponentState = {}

  private handleEditRecord = async () => {
    const record = await this.props.onEditRecord(this.props.field.model, this.props.value)

    if (record) {
      this.setState({record})
      this.props.onValueChange(record.id, this.props.changeKey)
    }
  }

  private handleNewRecord = async () => {
    const record = await this.props.onEditRecord(this.props.field.model)

    if (record) {
      this.setState({record})
      this.props.onValueChange(record.id, this.props.changeKey)
    }
  }

  private handleSelectRecord = async () => {
    const record = await this.props.onSelectRecord(this.props.field.model)

    if (record) {
      this.setState({record})
      this.props.onValueChange(record.id, this.props.changeKey)
    }
  }

  private async loadRecord(id: Ref) {
    this.setState({
      isLoadingRecord: true
    })

    this.setState({
      isLoadingRecord: false,
      record: await this.props.sessionContext.getRecord(this.props.field.model, id)
    })
  }

  public componentDidMount() {
    if (this.props.value) this.loadRecord(this.props.value)
  }

  public render() {
    let content: React.ReactNode
    let leftFooterContent: React.ReactNode

    const record = this.state.record
    const viewContext = this.props.sessionContext.viewContextMap.get(this.props.field.model)
    const _ = this.props.localeContext.get

    if (!viewContext) {
      return <div /> // TODO: Error
    }

    if (false) {
      // TODO: Error this.state.error
      // content = <CardError>{this.state.error}</CardError>
    } else if (this.state.isLoadingRecord) {
      content = (
        <CardSection>
          <LoadingIndicator style={LoadingIndicatorStyle.Dark} />
        </CardSection>
      )
    } else if (record) {
      const updatedDateString = record.updated.toLocaleDateString(this.props.localeContext.locale, {
        hour: 'numeric',
        minute: 'numeric'
      })

      const createdDateString = record.created.toLocaleDateString(this.props.localeContext.locale, {
        hour: 'numeric',
        minute: 'numeric'
      })

      content = <DescriptionView viewContext={viewContext} record={record} />

      leftFooterContent = (
        <>
          <div>
            {_('recordUpdated')}: {updatedDateString}
          </div>
          <div>
            {_('recordCreated')}: {createdDateString}
          </div>
        </>
      )
    } else {
      content = <CardSection>{_('noRecordSelected')}</CardSection>
    }

    let errorContent: React.ReactNode

    // if (this.props.field.errors.length > 0) {
    //   errorContent = (
    //     <CardError>
    //       <FlexList>
    //         {this.props.store.errors.map((errorMessage, index) => (
    //           <div key={index}>{errorMessage}</div>
    //         ))}
    //       </FlexList>
    //     </CardError>
    //   )
    // }

    let editButtons: React.ReactNode

    // TODO: this.props.store.disableEditing
    if (true) {
      editButtons = (
        <>
          <Button
            type={ButtonType.Icon}
            key="new"
            label={_('newRecord')}
            icon={IconName.NewDocument}
            onTrigger={this.handleNewRecord}
            disabled={this.props.disabled}
          />
          {this.props.value != undefined && (
            <Button
              type={ButtonType.Icon}
              key="edit"
              label={_('editRecord')}
              icon={IconName.EditDocument}
              onTrigger={this.handleEditRecord}
              disabled={this.props.disabled}
            />
          )}
        </>
      )
    }

    return (
      <FieldComponent
        className={RefFieldEditComponentStyle}
        depth={this.props.depth}
        index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.field.label}
            description={this.props.field.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <Card markerColor={viewContext.color}>
          {content}
          <CardFooter
            contentLeft={leftFooterContent}
            contentRight={
              <>
                {editButtons}
                <Button
                  type={ButtonType.Icon}
                  label={_('selectRecord')}
                  icon={IconName.SelectDocument}
                  onTrigger={this.handleSelectRecord}
                  disabled={this.props.disabled}
                />
              </>
            }
          />
        </Card>
        {errorContent}
      </FieldComponent>
    )
  }
}

export const RefFieldEditComponentStyle = style({
  $debugName: 'RefField',

  $nest: {
    '> .buttonWrapper': {
      display: 'flex',

      opacity: 0.5,
      marginTop: Spacing.large,

      $nest: {
        '> button': {
          marginRight: Spacing.medium
        }
      }
    },

    '&:hover > .buttonWrapper': {
      opacity: 1
    }
  }
})

export const RefFieldEditComponentContainer = withLocale(withSession(RefFieldEditComponent))

export interface RefFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly model: Ref
}

export type RefFieldValue = Ref | undefined

export class RefField implements Field<RefFieldValue> {
  public readonly label?: string
  public readonly description?: string
  public readonly model: Ref

  public readonly defaultValue: RefFieldValue = undefined
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: RefFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.model = opts.model
  }

  public renderListComponent(props: ListRenderProps<RefFieldValue>) {
    return <CardSection>{props.value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<RefFieldValue>) {
    return <RefFieldEditComponentContainer {...props} field={this} />
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: RefFieldValue) {
    if (!value) return e.null()
    return e.data(d.ref(value))
  }

  public isValidValue(value: RefFieldValue) {
    return value == undefined ? ['emptyRefError'] : null
  }

  public serialize() {
    return {
      type: RefField.type,
      label: this.label,
      description: this.description
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'ref'

  static inferFromModel(model: Model, key: string | undefined) {
    if (model.type !== 'ref') return null
    return new RefField({label: key && convertKeyToLabel(key), model: model.model})
  }

  static unserialize(rawField: SerializedField, model: Model) {
    if (model.type !== 'ref') {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new RefField({
      label: rawField.label,
      description: rawField.description,
      model: model.model
    })
  }
}
