import React from 'react'
import Slate from 'slate'
import {RenderMarkProps, RenderNodeProps} from 'slate-react'
import {IconName, ButtonType, Button} from '@karma.run/editor-client'
import {ObjectMap} from '@karma.run/editor-common'

export type SlateData = Slate.Block['data']

export interface SlateControlRenderProps {
  disabled: boolean
  value: Slate.Value

  onValueChange(changeFn: (change: Slate.Change) => Slate.Change): void
  onEditData(dataKey: string, data?: SlateData): Promise<{[key: string]: any} | undefined>
}

export interface SlateControlComponentRenderProps<C = any> extends SlateControlRenderProps {
  control: C
}

export interface SlateControl {
  renderNode?(props: RenderNodeProps): React.ReactNode
  renderMark?(props: RenderMarkProps): React.ReactNode
  renderControl(props: SlateControlRenderProps): React.ReactNode
}

export interface MarkControlOptions {
  readonly type: string
  readonly label?: string
  readonly icon?: IconName

  render(children: React.ReactNode): React.ReactNode
}

export class SlateMarkControl implements SlateControl {
  public readonly type: string
  public readonly label?: string
  public readonly icon?: IconName
  private readonly renderFn: (children: React.ReactNode) => React.ReactNode

  constructor(opts: MarkControlOptions) {
    this.type = opts.type
    this.label = opts.label
    this.icon = opts.icon
    this.renderFn = opts.render
  }

  public renderMark(props: RenderMarkProps): React.ReactNode {
    if (this.type !== props.mark.type) return
    return <span {...props.attributes}>{this.renderFn(props.children)}</span>
  }

  public renderControl(props: SlateControlRenderProps) {
    return <SlateMarkControlComponent {...props} control={this} />
  }
}

export class SlateMarkControlComponent extends React.Component<
  SlateControlComponentRenderProps<SlateMarkControl>
> {
  private get hasMark() {
    return this.props.value.activeMarks.some(mark => mark!.type === this.props.control.type)
  }

  private handleMouseDown = () => {
    this.props.onValueChange(change => change.toggleMark(this.props.control.type))
  }

  public render() {
    return (
      <Button
        disabled={this.props.disabled}
        selected={this.hasMark}
        type={ButtonType.Light}
        icon={this.props.control.icon}
        label={this.props.control.label}
        onMouseDown={this.handleMouseDown}
      />
    )
  }
}

export interface BlockControlOptions {
  readonly type: string
  readonly label?: string
  readonly icon?: IconName
  readonly dataKey?: string

  render(children: React.ReactNode): React.ReactNode
}

export class SlateBlockControl implements SlateControl {
  public readonly type: string
  public readonly label?: string
  public readonly icon?: IconName
  public readonly dataKey?: string

  private readonly renderFn: (
    children: React.ReactNode,
    data: ObjectMap<any>,
    isSelected: boolean
  ) => React.ReactNode

  constructor(opts: BlockControlOptions) {
    this.type = opts.type
    this.label = opts.label
    this.icon = opts.icon
    this.dataKey = opts.dataKey
    this.renderFn = opts.render
  }

  public renderNode(props: RenderNodeProps): React.ReactNode {
    const {attributes, children, node, isSelected} = props

    if (this.type !== node.type) return
    return <div {...attributes}>{this.renderFn(children, node.data.toJS(), isSelected)}</div>
  }

  public renderControl(props: SlateControlRenderProps) {
    return <SlateBlockControlComponent {...props} control={this} />
  }
}

export class SlateBlockControlComponent extends React.Component<
  SlateControlComponentRenderProps<SlateBlockControl>
> {
  private get hasBlock() {
    return this.activeBlock != undefined
  }

  private get activeBlock() {
    return this.props.value.blocks.find(block => this.props.control.type === block!.type)
  }

  private handleMouseDown = async () => {
    this.props.onValueChange(change => change.toggleMark(this.props.control.type))

    const control = this.props.control
    const activeBlock = this.activeBlock

    const newFieldValue = control.dataKey
      ? await this.props.onEditData(control.dataKey, activeBlock ? activeBlock.data : undefined)
      : undefined

    // Pressed back in FieldEditor.
    if (control.dataKey && !newFieldValue && !activeBlock) return

    this.props.onValueChange(change => {
      if (!newFieldValue && activeBlock) {
        change = change.setBlocks('')
      } else {
        const data = control.dataKey ? {[control.dataKey]: newFieldValue!.value} : undefined
        change = change.setBlocks({type: this.props.control.type, data})
      }

      return change
    })
  }

  public render() {
    return (
      <Button
        disabled={this.props.disabled}
        selected={this.hasBlock}
        type={ButtonType.Light}
        icon={this.props.control.icon}
        label={this.props.control.label}
        onMouseDown={this.handleMouseDown}
      />
    )
  }
}

export const BoldMarkControl = new SlateMarkControl({
  type: 'bold',
  icon: IconName.FormatBold,
  render: children => {
    return <strong>{children}</strong>
  }
})

export const ItalicMarkControl = new SlateMarkControl({
  type: 'italic',
  icon: IconName.FormatItalic,
  render: children => {
    return <em>{children}</em>
  }
})

export const UnderlineMarkControl = new SlateMarkControl({
  type: 'underline',
  icon: IconName.FormatUnderline,
  render: children => {
    return <span style={{textDecoration: 'underline'}}>{children}</span>
  }
})

export const StrikethroughMarkControl = new SlateMarkControl({
  type: 'strikethrough',
  icon: IconName.FormatStrikethrough,
  render: children => {
    return <span style={{textDecoration: 'line-through'}}>{children}</span>
  }
})

export const commonMarkControls = {
  bold: BoldMarkControl,
  italic: ItalicMarkControl,
  underline: UnderlineMarkControl,
  strikethrough: StrikethroughMarkControl
}
