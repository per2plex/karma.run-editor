import React from 'react'
import {EditorState, convertFromRaw} from 'draft-js'
import {expression as e} from '@karma.run/sdk'

import {Model} from '../api/model'
import {ErrorField} from './error'

import {EditComponentRenderProps, EditRenderProps, Field, ListRenderProps} from './interface'

import {
  RichTextInput,
  Control,
  LinkType,
  BlockType,
  StyleGroup,
  CustomElement
} from '../ui/richTextInput'

import {FieldComponent, FieldLabel} from '../ui/field'
import {SortConfiguration, FilterConfiguration} from '../interface/filter'
import {CardSection} from '../ui/card'

export class RichTextFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<RichTextField, RichTextFieldValue>
> {
  private handleValueChange = (value: any) => {
    this.props.onValueChange(value, this.props.changeKey)
  }

  private handleOpenBlockEditor = () => {}
  private handleOpenLinkEditor = () => {}

  public render() {
    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index}
          />
        )}
        <RichTextInput
          value={this.props.value}
          onOpenBlockEditor={this.handleOpenBlockEditor}
          onOpenLinkEditor={this.handleOpenLinkEditor}
          onChange={this.handleValueChange}
          controls={this.props.field.controls}
          links={this.props.field.links}
          styleGroups={this.props.field.styleGroups}
          blocks={this.props.field.blocks}
          elements={this.props.field.elements}
          linkEntityType={this.props.field.linkEntityType}
          maxLength={this.props.field.maxLength}
        />
      </FieldComponent>
    )
  }
}

export interface StringFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly multiline?: boolean
}

export type RichTextFieldValue = EditorState

export class RichTextField implements Field<RichTextFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly minLength?: number
  public readonly maxLength?: number

  public readonly defaultValue: RichTextFieldValue = EditorState.createEmpty()
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public readonly controls: Set<Control> = new Set()
  public readonly links: LinkType[] = []
  public readonly blocks: BlockType[] = []
  public readonly styleGroups: StyleGroup[] = []
  public readonly elements: CustomElement[] = []
  public readonly linkEntityType: string = 'LINK'

  public constructor(opts: StringFieldOptions) {
    this.label = opts.label
    this.description = opts.description
    this.minLength = opts.minLength
    this.maxLength = opts.maxLength
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<RichTextFieldValue>) {
    return <CardSection>{props.value.getCurrentContent().getPlainText()}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<RichTextFieldValue>) {
    return (
      <RichTextFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return EditorState.createWithContent(convertFromRaw(value))
  }

  public transformValueToExpression(_value: RichTextFieldValue) {
    return e.null()
  }

  public isValidValue(value: RichTextFieldValue) {
    const errors: string[] = []
    const plainText = value.getCurrentContent().getPlainText()

    if (this.maxLength && plainText.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && plainText.length < this.minLength) errors.push('stringToShortError')

    return errors
  }

  public serialize() {
    return {
      type: RichTextField.type,
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

  public static type = 'richText'

  static isValidModel(_model: Model) {
    return false // TODO
  }

  static inferFromModel(model: Model, label: string | undefined) {
    if (this.isValidModel(model)) return null
    return new this({label})
  }

  static unserialize(rawField: any, model: Model) {
    if (this.isValidModel(model)) {
      return new ErrorField({
        label: rawField.label,
        description: rawField.description,
        message: 'Invalid model!'
      })
    }

    return new this({
      label: rawField.label,
      description: rawField.description
    })
  }
}
