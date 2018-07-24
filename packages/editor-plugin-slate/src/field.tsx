import React from 'react'
import Slate from 'slate'
import {style} from 'typestyle'

import {Editor as SlateEditor, RenderMarkProps} from 'slate-react'
import plainTextSerializer from 'slate-plain-serializer'

import {expression as e} from '@karma.run/sdk'
import {Model, SortConfiguration, FilterConfiguration} from '@karma.run/editor-common'

import {
  ErrorField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps,
  FieldComponent,
  FieldLabel,
  CardSection,
  SerializedField,
  DefaultBorderRadiusPx,
  Color,
  Spacing,
  boolAttr,
  Button,
  ButtonType,
  IconName,
  FlexList
} from '@karma.run/editor-client'

export const boldMarkOption: MarkOption = {
  type: 'bold',
  icon: IconName.FormatBold,
  render: children => {
    return <strong>{children}</strong>
  }
}

export const italicMarkOption: MarkOption = {
  type: 'italic',
  icon: IconName.FormatItalic,
  render: children => {
    return <em>{children}</em>
  }
}

export const underlineMarkOption: MarkOption = {
  type: 'underline',
  icon: IconName.FormatUnderline,
  render: children => {
    return <span style={{textDecoration: 'underline'}}>{children}</span>
  }
}

export const strikethroughMarkOption: MarkOption = {
  type: 'strikethrough',
  icon: IconName.FormatStrikethrough,
  render: children => {
    return <span style={{textDecoration: 'line-through'}}>{children}</span>
  }
}

export const commonMarkOptions: MarkOption[] = [
  boldMarkOption,
  italicMarkOption,
  underlineMarkOption,
  strikethroughMarkOption
]

export interface MarkOption {
  type: string
  label?: string
  icon?: IconName
  render: (children: React.ReactNode) => React.ReactNode
}

export interface MarkGroupOption {}

export interface SlateFieldEditComponentState {
  hasFocus: boolean
}

export class SlateFieldEditComponent extends React.PureComponent<
  EditComponentRenderProps<SlateField, SlateFieldValue>,
  SlateFieldEditComponentState
> {
  public state: SlateFieldEditComponentState = {
    hasFocus: false
  }

  public editorRef = React.createRef<SlateEditor>()

  private handleChange = (value: Slate.Change) => {
    this.props.onValueChange(value.value, this.props.changeKey)
  }

  private handleWrapperPointerDown = () => {
    this.setState({hasFocus: true})

    setTimeout(() => {
      this.editorRef.current!.focus()
    })
  }

  private handleEditorFocus = () => {
    this.setState({hasFocus: true})
  }

  private handleEditorBlur = () => {
    this.setState({hasFocus: false})
  }

  private handleMarkToggle = (type: string) => {
    this.props.onValueChange(this.props.value.change().toggleMark(type).value, this.props.changeKey)
  }

  private hasMark = (type: string) => {
    return this.props.value.activeMarks.some(mark => mark!.type === type)
  }

  private renderMark = (props: RenderMarkProps) => {
    const {attributes, children, mark} = props
    const markOption = this.props.field.markOptionMap.get(mark.type)

    if (!markOption) return <span {...attributes}>{children}</span>

    return <span {...attributes}>{markOption.render(children)}</span>
  }

  private renderMarkButtons = () => {
    const markOptions = this.props.field.markOptions
    if (!markOptions || !markOptions.length) return null

    return markOptions.map(markOption => (
      <Button
        key={markOption.type}
        disabled={!this.state.hasFocus}
        selected={this.hasMark(markOption.type)}
        type={ButtonType.Light}
        icon={markOption.icon}
        label={markOption.label}
        data={markOption.type}
        onMouseDown={this.handleMarkToggle}
      />
    ))
  }

  public render() {
    return (
      <FieldComponent
        className={SlateFieldEditComponentStyle}
        depth={this.props.depth}
        index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index}
          />
        )}
        <div
          className="inputWrapper"
          onFocus={this.handleEditorFocus}
          onBlur={this.handleEditorBlur}>
          <div
            className="toolbar"
            data-has-focus={boolAttr(this.state.hasFocus)}
            onPointerDown={this.handleWrapperPointerDown}>
            <FlexList spacing="large">
              <FlexList>{this.renderMarkButtons()}</FlexList>
            </FlexList>
          </div>
          <SlateEditor
            ref={this.editorRef}
            className="editor"
            value={this.props.value}
            renderMark={this.renderMark}
            onChange={this.handleChange}
          />
        </div>
      </FieldComponent>
    )
  }
}

export const SlateFieldEditComponentStyle = style({
  $nest: {
    '> .inputWrapper': {
      fontSize: '1em',
      lineHeight: 1.2,

      border: `1px solid ${Color.neutral.light1}`,
      backgroundColor: Color.neutral.white,
      borderRadius: DefaultBorderRadiusPx,

      $nest: {
        '> .toolbar': {
          padding: Spacing.small,
          backgroundColor: Color.neutral.light1,
          opacity: 0.5,

          $nest: {
            '&[data-has-focus]': {
              opacity: 1
            }
          }
        },

        '> .editor': {
          overflowY: 'auto',
          padding: Spacing.medium,
          maxHeight: '33vh',
          borderTop: `1px solid ${Color.neutral.light1}`
        }
      }
    }
  }
})

export interface SlateFieldOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number
  readonly markOptions?: MarkOption[]
}

export type SlateFieldValue = Slate.Value
export type SerializedSlateField = SerializedField & SlateFieldOptions

export class SlateField implements Field<SlateFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly minLength?: number
  public readonly maxLength?: number

  public readonly markOptions: MarkOption[]
  public readonly markOptionMap: ReadonlyMap<string, MarkOption>

  public readonly defaultValue: SlateFieldValue = Slate.Value.create({
    document: Slate.Document.create([Slate.Block.create('')])
  })
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: SlateFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.minLength = opts && opts.minLength
    this.maxLength = opts && opts.maxLength

    this.markOptions = commonMarkOptions

    this.markOptionMap = new Map(
      this.markOptions.map(markOption => [markOption.type, markOption] as [string, MarkOption])
    )
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<SlateFieldValue>) {
    const plainText = plainTextSerializer.serialize(props.value)
    return <CardSection>{plainText}</CardSection>
  }

  public renderEditComponent(props: EditRenderProps<SlateFieldValue>) {
    return (
      <SlateFieldEditComponent
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return Slate.Value.create({
      document: Slate.Document.fromJSON(value)
    })
  }

  public transformValueToExpression(value: SlateFieldValue) {
    console.log(JSON.stringify(serializeValue(value.document), undefined, 2))

    return e.null()
  }

  public isValidValue(value: SlateFieldValue) {
    const errors: string[] = []
    const plainText = plainTextSerializer.serialize(value)

    if (this.maxLength && plainText.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && plainText.length < this.minLength) errors.push('stringToShortError')

    return errors
  }

  public serialize(): SerializedSlateField {
    return {
      type: SlateField.type,
      label: this.label,
      description: this.description,
      minLength: this.minLength,
      maxLength: this.maxLength,
      markOptions: this.markOptions
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public static type = 'richText'

  static canInferFromModel(model: Model) {
    if (model.type === 'annotation' && model.value === 'field:richText') {
      return true
    }

    return false
  }

  static create(model: Model, opts?: SlateFieldOptions) {
    if (model.type === 'annotation') {
      model = model.model
    }

    if (model.type !== 'struct') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "struct" received: "${model.type}"`
      })
    }

    return new this(opts)
  }

  static unserialize(rawField: SerializedSlateField) {
    return new this(rawField)
  }
}

export function unserializeValue(_value: any) {}

export function serializeValue(value: Slate.Document) {
  function recurse(value: any) {
    return value.nodes.map((node: any) => {
      switch (node.type) {
        default:
        case 'block':
        case 'inline': {
          return {
            type: node.type,
            isVoid: node.isVoid,
            data: Object.keys(node.data).length ? {[node.type]: node.data} : null
          }
        }
      }
    })
  }

  return recurse(value.toJSON())
}

// {
//   recursion: {
//     label: 'node',
//     model: {
//       struct: {
//         object: { string: {} },
//         type: { optional: { string: {} } },
//         data: {
//           optional: {
//             struct: {} // Union
//           }
//         },
//         isVoid: { optional: { bool: {} } },
//         text: { optional: { string: {} } },
//         nodes: { optional: { list: { recurse: 'node' } } }
//       }
//     }
//   }
// }
