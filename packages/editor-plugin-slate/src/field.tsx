import React from 'react'
import Slate from 'slate'
import {style} from 'typestyle'
import memoizeOne from 'memoize-one'

import {Editor as SlateEditor, RenderMarkProps, RenderNodeProps} from 'slate-react'
import plainTextSerializer from 'slate-plain-serializer'

import {data as d, DataExpression} from '@karma.run/sdk'

import {
  Model,
  SortConfiguration,
  FilterConfiguration,
  TypedFieldOptions,
  ObjectMap,
  mapObject
} from '@karma.run/editor-common'

import {
  ErrorField,
  EditComponentRenderProps,
  EditRenderProps,
  Field,
  ListRenderProps,
  FieldComponent,
  FieldLabel,
  CardSection,
  DefaultBorderRadiusPx,
  Color,
  Spacing,
  boolAttr,
  Button,
  ButtonType,
  IconName,
  FlexList,
  FieldConstructor,
  CreateFieldFunction
} from '@karma.run/editor-client'

export enum ControlType {
  Mark = 'mark',
  Inline = 'inline',
  Block = 'block',
  InlineElement = 'inlineElement',
  BlockElement = 'blockElement'
}

export const boldMarkControl: MarkControl = {
  type: ControlType.Mark,
  icon: IconName.FormatBold,
  render: children => {
    return <strong>{children}</strong>
  }
}

export const italicMarkControl: MarkControl = {
  type: ControlType.Mark,
  icon: IconName.FormatItalic,
  render: children => {
    return <em>{children}</em>
  }
}

export const underlineMarkControl: MarkControl = {
  type: ControlType.Mark,
  icon: IconName.FormatUnderline,
  render: children => {
    return <span style={{textDecoration: 'underline'}}>{children}</span>
  }
}

export const strikethroughMarkControl: MarkControl = {
  type: ControlType.Mark,
  icon: IconName.FormatStrikethrough,
  render: children => {
    return <span style={{textDecoration: 'line-through'}}>{children}</span>
  }
}

export const commonMarkControls = {
  bold: boldMarkControl,
  italic: italicMarkControl,
  underline: underlineMarkControl,
  strikethrough: strikethroughMarkControl
}

export interface MarkControl {
  type: ControlType.Mark
  label?: string
  icon?: IconName
  render: (children: React.ReactNode) => React.ReactNode
}

export interface InlineControl {
  type: ControlType.Inline
  label?: string
  icon?: IconName
  dataKey?: string
  render: (children: React.ReactNode, data: any) => React.ReactNode
}

export interface BlockControl {
  type: ControlType.Block
  label?: string
  icon?: IconName
  dataKey?: string
  render: (children: React.ReactNode, data: any) => React.ReactNode
}

export interface InlineElementControl {
  type: ControlType.InlineElement
  label?: string
  icon?: IconName
  dataKey?: string
  render: (children: React.ReactNode, data: any) => React.ReactNode
}

export interface BlockElementControl {
  type: ControlType.BlockElement
  label?: string
  icon?: IconName
  dataKey?: string
  render: (children: React.ReactNode, data: any) => React.ReactNode
}

export type Control =
  | MarkControl
  | InlineControl
  | BlockControl
  | InlineElementControl
  | BlockElementControl

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

  private handleInline = async ([type, control]: [string, InlineControl]) => {
    const activeInline = this.activeInlineOfType(type)

    const newFieldValue = control.dataKey
      ? await this.props.onEditField(
          this.props.field.dataFields[control.dataKey],
          activeInline ? activeInline.data.get(control.dataKey) : undefined
        )
      : undefined

    if (control.dataKey) this.editorRef.current!.focus()

    // Pressed back in FieldEditor.
    if (control.dataKey && !newFieldValue && !activeInline) return

    if (!newFieldValue && activeInline) {
      const newValue = this.props.value.change().unwrapInline(type).value
      this.props.onValueChange(newValue, this.props.changeKey)
    } else {
      const data = control.dataKey ? {[control.dataKey]: newFieldValue!.value} : undefined
      const newValue = activeInline
        ? this.props.value.change().setInlines({type, data}).value
        : this.props.value.change().wrapInline({type, data}).value

      this.props.onValueChange(newValue, this.props.changeKey)
    }
  }

  private handleBlock = async ([type, control]: [string, BlockControl]) => {
    const activeBlock = this.activeBlockOfType(type)

    const newFieldValue = control.dataKey
      ? await this.props.onEditField(
          this.props.field.dataFields[control.dataKey],
          activeBlock ? activeBlock.data.get(control.dataKey) : undefined
        )
      : undefined

    if (control.dataKey) this.editorRef.current!.focus()

    // Pressed back in FieldEditor.
    if (control.dataKey && !newFieldValue && !activeBlock) return

    if (!newFieldValue && activeBlock) {
      const newValue = this.props.value.change().setBlocks('').value
      this.props.onValueChange(newValue, this.props.changeKey)
    } else {
      const data = control.dataKey ? {[control.dataKey]: newFieldValue!.value} : undefined
      const newValue = this.props.value.change().setBlocks({type, data}).value

      this.props.onValueChange(newValue, this.props.changeKey)
    }
  }

  private hasMark = (type: string) => {
    return this.props.value.activeMarks.some(mark => mark!.type === type)
  }

  private hasInlineOfType = (type: string) => {
    return this.activeInlineOfType(type) != undefined
  }

  private activeInlineOfType = (type: string): Slate.Inline | undefined => {
    return this.props.value.inlines.find(inline => inline!.type === type)
  }

  private hasBlockOfType = (type: string) => {
    return this.activeBlockOfType(type) != undefined
  }

  private activeBlockOfType = (type: string): Slate.Block | undefined => {
    return this.props.value.blocks.find(block => block!.type === type)
  }

  private renderMark = (props: RenderMarkProps) => {
    const {attributes, children, mark} = props
    const control = this.props.field.controlsMap.get(mark.type)

    if (!control || control.type !== ControlType.Mark) {
      return null
    }

    return <span {...attributes}>{control.render(children)}</span>
  }

  private renderNode = (props: RenderNodeProps) => {
    const {attributes, children, node} = props

    if (!node.type) return null

    const control = this.props.field.controlsMap.get(node.type)

    if (!control) return null

    switch (control.type) {
      case ControlType.Inline:
      case ControlType.InlineElement:
        return <span {...attributes}>{control.render(children, node.data)}</span>

      case ControlType.Block:
      case ControlType.BlockElement:
        return <div {...attributes}>{control.render(children, node.data)}</div>

      case ControlType.Mark:
        throw new Error('Tried to render mark as node.')
    }
  }

  private controlGroups = memoizeOne(
    (controlKeys: string[][], controlsMap: ReadonlyMap<string, Control>) => {
      return controlKeys.map(keys =>
        keys.map(key => [key, controlsMap.get(key)] as [string, Control])
      )
    }
  )

  private renderToolbar = () => {
    if (!this.props.field.controlKeys.length) return null

    return (
      <div
        className="toolbar"
        data-has-focus={boolAttr(this.state.hasFocus)}
        onPointerDown={this.handleWrapperPointerDown}>
        {this.renderControls()}
      </div>
    )
  }

  private renderControls = () => {
    const controlGroups = this.controlGroups(
      this.props.field.controlKeys,
      this.props.field.controlsMap
    )
    return (
      <FlexList spacing="large">
        {controlGroups.map(controls => (
          <FlexList key={controls.map(([key]) => key).join('.')}>
            {controls.map(([key, control]) => (
              <React.Fragment key={key}>{this.renderControl(key, control)}</React.Fragment>
            ))}
          </FlexList>
        ))}
      </FlexList>
    )
  }

  private renderControl = (key: string, control: Control) => {
    switch (control.type) {
      case ControlType.Mark:
        return (
          <Button
            disabled={!this.state.hasFocus}
            selected={this.state.hasFocus && this.hasMark(key)}
            type={ButtonType.Light}
            icon={control.icon}
            label={control.label}
            data={key}
            onMouseDown={this.handleMarkToggle}
          />
        )

      case ControlType.Inline:
        const hasInlines = this.hasInlineOfType(key)

        return (
          <Button
            disabled={!this.state.hasFocus || (!this.props.value.isExpanded && !hasInlines)}
            selected={hasInlines}
            type={ButtonType.Light}
            icon={control.icon}
            label={control.label}
            data={[key, control]}
            onMouseDown={this.handleInline}
          />
        )

      case ControlType.Block:
        const hasBlock = this.hasBlockOfType(key)

        return (
          <Button
            disabled={!this.state.hasFocus}
            selected={hasBlock}
            type={ButtonType.Light}
            icon={control.icon}
            label={control.label}
            data={[key, control]}
            onMouseDown={this.handleBlock}
          />
        )

      default:
        return null
    }
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
          {this.renderToolbar()}

          <SlateEditor
            ref={this.editorRef}
            className="editor"
            value={this.props.value}
            renderMark={this.renderMark}
            renderNode={this.renderNode}
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
          backgroundColor: Color.neutral.light2
        },

        '> .editor': {
          overflowY: 'auto',
          padding: Spacing.medium,
          maxHeight: '33vh',
          $nest: {
            '&:not(:first-child)': {
              borderTop: `1px solid ${Color.neutral.light1}`
            }
          }
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
  readonly controlKeys?: string[][]
  readonly dataFields?: ObjectMap<TypedFieldOptions>
}

export interface SlateFieldConstructorOptions {
  readonly label?: string
  readonly description?: string
  readonly minLength?: number
  readonly maxLength?: number

  readonly controlKeys: string[][]
  readonly controlMap: ReadonlyMap<string, Control>
  readonly dataFields: ObjectMap<Field>
}

export type SlateFieldValue = Slate.Value

// Slate typings don't include leave and mark JSON.
export type SlateMarkJSON = {object: 'mark'; type: string}
export type SlateLeaveJSON = {object: 'leaf'; text: string; marks?: SlateMarkJSON[]}
export type SlateJSON = Slate.NodeJSON | SlateLeaveJSON | SlateMarkJSON

export class SlateField implements Field<SlateFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly minLength?: number
  public readonly maxLength?: number

  public readonly controlKeys: string[][]
  public readonly controlsMap: ReadonlyMap<string, Control>
  public readonly dataFields: ObjectMap<Field>

  public readonly defaultValue: SlateFieldValue = Slate.Value.create({
    document: Slate.Document.create([Slate.Block.create('')])
  })

  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts: SlateFieldConstructorOptions) {
    this.label = opts.label
    this.description = opts.description
    this.minLength = opts.minLength
    this.maxLength = opts.maxLength

    this.controlKeys = opts.controlKeys
    this.controlsMap = opts.controlMap
    this.dataFields = opts.dataFields
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
    const documentJSON: Slate.DocumentJSON = value.document.toJSON()

    const recurse = (node: SlateJSON): DataExpression => {
      switch (node.object) {
        case 'document':
          return d.struct({
            object: d.string('document'),
            data: d.null(),
            nodes: node.nodes ? d.list(...node.nodes.map(node => recurse(node))) : d.null()
          })

        case 'inline':
        case 'block':
          const control = node.type
            ? (this.controlsMap.get(node.type) as BlockControl | InlineControl | undefined)
            : undefined

          const dataField =
            control && control.dataKey && node.data ? this.dataFields[control.dataKey] : undefined

          const data = dataField
            ? d.union(
                control!.dataKey!,
                dataField.transformValueToExpression(node.data![control!.dataKey!])
              )
            : d.null()

          return d.struct({
            object: d.string(node.object),
            type: node.type ? d.string(node.type) : d.null(),
            data: data,
            nodes: node.nodes ? d.list(...node.nodes.map(node => recurse(node))) : d.null()
          })

        case 'text':
          return d.struct({
            object: d.string('text'),
            leaves: node.leaves
              ? d.list(...node.leaves.map(leave => recurse(leave as SlateLeaveJSON)))
              : d.null()
          })

        case 'leaf':
          return d.struct({
            object: d.string('leaf'),
            text: d.string(node.text),
            marks: node.marks ? d.list(...node.marks.map(mark => recurse(mark))) : d.null()
          })

        case 'mark':
          return d.struct({
            object: d.string('mark'),
            type: d.string(node.type)
          })

        default:
          return d.null()
      }
    }

    return recurse(documentJSON)
  }

  public isValidValue(value: SlateFieldValue) {
    const errors: string[] = []
    const plainText = plainTextSerializer.serialize(value)

    if (this.maxLength && plainText.length > this.maxLength) errors.push('stringToLongError')
    if (this.minLength && plainText.length < this.minLength) errors.push('stringToShortError')

    return errors
  }

  public fieldOptions(): SlateFieldOptions & TypedFieldOptions {
    return {
      type: SlateFieldType,
      label: this.label,
      description: this.description,
      minLength: this.minLength,
      maxLength: this.maxLength,
      controlKeys: this.controlKeys,
      dataFields: mapObject(this.dataFields, field => field.fieldOptions())
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }
}

export const SlateFieldType = 'richText'

export const SlateFieldConstructor = (controlMap: ReadonlyMap<string, Control>) => {
  return {
    type: SlateFieldType,

    canInferFromModel(model: Model) {
      if (model.type === 'annotation' && model.value === 'field:richText') {
        return true
      }

      if (
        model.type === 'recursion' &&
        model.model.type === 'struct' &&
        model.model.fields['type'] &&
        model.model.fields['object'] &&
        model.model.fields['nodes'] &&
        model.model.fields['isVoid'] &&
        model.model.fields['text'] &&
        model.model.fields['nodes'] &&
        model.model.fields['data']
      ) {
        return true
      }

      return false
    },

    create(model: Model, opts: SlateFieldOptions | undefined, createField: CreateFieldFunction) {
      if (model.type === 'annotation') {
        model = model.model
      }

      if (model.type !== 'recursion') {
        return new ErrorField({
          label: opts && opts.label,
          description: opts && opts.description,
          message: `Expected model type "recursion" received: "${model.type}"`
        })
      }

      if (model.model.type !== 'struct') {
        return new ErrorField({
          label: opts && opts.label,
          description: opts && opts.description,
          message: `Expected model type "struct" received: "${model.type}"`
        })
      }

      const dataModel = model.model.fields['data']

      if (dataModel.type !== 'optional') {
        return new ErrorField({
          label: opts && opts.label,
          description: opts && opts.description,
          message: `Expected model type "optional" received: "${model.type}"`
        })
      }

      const unionModel = dataModel.model

      if (unionModel.type !== 'union') {
        return new ErrorField({
          label: opts && opts.label,
          description: opts && opts.description,
          message: `Expected model type "union" received: "${model.type}"`
        })
      }

      return new SlateField({
        ...opts,
        controlKeys: (opts && opts.controlKeys) || [],
        controlMap: controlMap,
        dataFields: mapObject(unionModel.fields, (field, key) =>
          createField(field, opts && opts.dataFields && opts.dataFields[key])
        )
      })
    }
  } as FieldConstructor
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
