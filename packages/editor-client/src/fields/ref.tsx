import React from 'react'
import * as shortid from 'shortid'
import {style} from 'typestyle'
import {expression as e, data as d, Ref, MetarializedRecord} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'
import {SerializedField, EditComponentRenderProps, EditRenderProps, Field} from './interface'
import {Field as FieldComponent, FieldLabel} from '../ui/fields/field'
import {TextAreaInput, TextInput, TextInputType} from '../ui/common/input'
import {CardSection, CardError, Card, CardFooter} from '../ui/common/card'
import {SortConfigration} from '../filter/configuration'
import {SortType} from '@karma.run/editor-common'
import {withSession, SessionContext} from '../context/session'
import {LoadingIndicator, LoadingIndicatorStyle} from '../ui/common/loader'
import {DescriptionView} from '../ui/common/descriptionView'
import {Button, ButtonType} from '../ui/common/button'
import {IconName} from '../ui/common/icon'
import {Spacing} from '../ui/style'

export interface RefFieldEditComponentProps extends EditComponentRenderProps<RefField> {
  sessionContext: SessionContext
}

export interface RefFieldEditComponentState {
  record?: MetarializedRecord
}

export class RefFieldEditComponent extends React.PureComponent<
  RefFieldEditComponentProps,
  RefFieldEditComponentState
> {
  public state: RefFieldEditComponentState = {}

  private handleChange = (value: any) => {
    this.props.onChange(value, this.props.changeKey)
  }

  public render() {
    let content: React.ReactNode
    let leftFooterContent: React.ReactNode

    const record = this.state.record
    const viewContext = this.props.sessionContext.viewContextMap.get(this.props.field.model)

    if (!viewContext) {
      return <div /> // TODO: Error
    }

    if (false) {
      // TODO: Error this.state.error
      // content = <CardError>{this.state.error}</CardError>
    } else if (!record) {
      content = (
        <CardSection>
          <LoadingIndicator style={LoadingIndicatorStyle.Dark} />
        </CardSection>
      )
    } else if (record) {
      const updatedDateString = new Date(record.updated).toLocaleDateString()
      const createdDateString = new Date(record.created).toLocaleDateString()

      content = (
        <DescriptionView
          viewContext={viewContext}
          record={record as any}
          reverseTagMap={this.props.sessionContext.reverseTagMap}
        />
      )

      leftFooterContent = (
        <>
          <div>Updated: {updatedDateString}</div>
          <div>Created: {createdDateString}</div>
        </>
      )
    } else {
      content = <CardSection>Select entry!</CardSection>
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
            label="New"
            icon={IconName.NewDocument}
            onTrigger={this.handleNewClick}
            disabled={this.props.disabled}
          />
          {this.props.value != undefined && (
            <Button
              type={ButtonType.Icon}
              key="edit"
              label="Edit"
              icon={IconName.EditDocument}
              onTrigger={this.handleEditClick}
              disabled={this.props.disabled}
            />
          )}
        </>
      )
    }

    return (
      <FieldComponent
        className={RefFieldEditComponent.Style}
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
                  label="Choose"
                  icon={IconName.ChooseDocument}
                  onTrigger={this.handleChooseClick}
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

export namespace RefFieldEditComponent {
  export const Style = style({
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
}

export const RefFieldEditComponentContainer = withSession(RefFieldEditComponent)

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

  public constructor(opts: RefFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.model = opts.model
  }

  public renderListComponent(value: Ref) {
    return <CardSection>{value}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<RefFieldValue>) {
    return <RefFieldEditComponentContainer {...props} field={this} />
  }

  public defaultValue() {
    return undefined
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(value: RefFieldValue) {
    if (!value) return e.null()
    return e.data(d.ref(value[0], value[1]))
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

  public sortConfigurations(): SortConfigration[] {
    return [{key: shortid.generate(), type: SortType.String, label: this.label || '', path: []}]
  }

  public static type = 'ref'

  static inferFromModel(model: Model, label: string | undefined) {
    if (model.type !== 'ref') return null
    return new RefField({label, model: model.model})
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
