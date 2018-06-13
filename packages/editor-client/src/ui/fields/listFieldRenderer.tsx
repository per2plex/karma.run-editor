import * as React from 'react'

import {observer} from 'mobx-react'

import {Button, FlexFiller, ButtonType} from '../../ui/common'
import {ListFieldStore} from '../../store/fields/listFieldStore'
import {RenderOpts, renderValueStore} from './renderFieldStore'
import {style} from 'typestyle'
import {IconName} from '../../ui/common/icon'
import {Field, FieldLabel, FieldInset, FieldWrapper} from '../../ui/fields/field'
import {Spacing, darkFieldColorForDepthAndIndex, Color} from '../../ui/style'

export namespace ListFieldRenderer {
  export interface Props extends RenderOpts {
    store: ListFieldStore
  }
}

@observer
export class ListFieldRenderer extends React.Component<ListFieldRenderer.Props> {
  private handleInsertFieldAt = (index?: number | string) => {
    this.props.store.insertValueAt(Number(index))
  }

  private moveFieldToIndex(index: number, toIndex: number) {
    this.props.store.moveValueToIndex(index, toIndex)
  }

  private handleMoveFieldUp = (index?: number | string) => {
    this.moveFieldToIndex(Number(index), Number(index) - 1)
  }

  private handleMoveFieldDown = (index?: number | string) => {
    this.moveFieldToIndex(Number(index), Number(index) + 1)
  }

  private handleInsertFieldBelow = (index?: number | string) => {
    this.handleInsertFieldAt(Number(index) + 1)
  }

  private handleRemoveFieldAt = (index?: number | string) => {
    this.props.store.removeValueAt(Number(index))
  }

  public render() {
    const fields = this.props.store.values.map((value, index) => {
      const {children, store, ...options} = this.props

      return (
        <ListFieldItem
          key={value.id}
          index={index}
          length={this.props.store.values.length}
          disabled={this.props.disabled}
          depth={this.props.depth + 1}
          label={`${this.props.store.label} #${index + 1}`}
          onMoveUp={this.handleMoveFieldUp}
          onMoveDown={this.handleMoveFieldDown}
          onAddAbove={this.handleInsertFieldAt}
          onAddBelow={this.handleInsertFieldBelow}
          onRemove={this.handleRemoveFieldAt}>
          {renderValueStore(value.store, {
            ...options,
            isWrapped: true,
            depth: this.props.depth + 1
          })}
        </ListFieldItem>
      )
    })

    const addButton = (
      <Button
        data={0}
        type={ButtonType.Icon}
        icon={IconName.Add}
        onTrigger={this.handleInsertFieldAt}
        disabled={this.props.disabled}
      />
    )

    const listContent = fields.length ? <FieldInset>{fields}</FieldInset> : undefined

    return (
      <FieldWrapper depth={this.props.depth} index={this.props.index}>
        <Field depth={this.props.depth} index={this.props.index}>
          <FieldLabel
            label={this.props.store.label}
            description={this.props.store.description}
            depth={this.props.depth}
            index={this.props.index || 0}
            rightContent={addButton}
          />
        </Field>
        {listContent}
      </FieldWrapper>
    )
  }
}

export namespace ListFieldItem {
  export interface Props {
    index: number
    length: number
    disabled: boolean
    depth: number
    label?: string
    onMoveUp: (index: number) => void
    onMoveDown: (index: number) => void
    onAddAbove: (index: number) => void
    onAddBelow: (index: number) => void
    onRemove: (index: number) => void
  }
}

export class ListFieldItem extends React.Component<ListFieldItem.Props> {
  public render() {
    const isLast = this.props.index >= this.props.length - 1
    const isFirst = this.props.index <= 0

    const headerStyle: React.CSSProperties = {
      backgroundColor: darkFieldColorForDepthAndIndex(this.props.depth, this.props.index)
    }

    return (
      <div className={ListFieldItem.Style}>
        <div className="header" style={headerStyle}>
          {this.props.label}
          <FlexFiller />
          {!isFirst && (
            <Button
              data={this.props.index}
              type={ButtonType.Icon}
              icon={IconName.ListArrowUp}
              onTrigger={this.props.onMoveUp}
              disabled={this.props.disabled}
            />
          )}
          {!isLast && (
            <Button
              data={this.props.index}
              type={ButtonType.Icon}
              icon={IconName.ListArrowDown}
              onTrigger={this.props.onMoveDown}
              disabled={this.props.disabled}
            />
          )}
          <Button
            data={this.props.index}
            type={ButtonType.Icon}
            icon={IconName.AddTop}
            onTrigger={this.props.onAddAbove}
            disabled={this.props.disabled}
          />
          <Button
            data={this.props.index}
            type={ButtonType.Icon}
            icon={IconName.AddBottom}
            onTrigger={this.props.onAddBelow}
            disabled={this.props.disabled}
          />
          <Button
            data={this.props.index}
            type={ButtonType.Icon}
            icon={IconName.Remove}
            onTrigger={this.props.onRemove}
            disabled={this.props.disabled}
          />
        </div>
        <div className="content">{this.props.children}</div>
      </div>
    )
  }
}

export namespace ListFieldItem {
  export const Style = style({
    $debugName: 'ListFieldItem',
    marginTop: Spacing.small,

    $nest: {
      '> .header': {
        display: 'flex',
        padding: Spacing.medium,
        color: Color.neutral.dark1,
        fontStyle: 'italic',

        $nest: {
          Button: {
            marginLeft: Spacing.small
          }
        }
      },

      '> .content': {},

      '&:first-child': {
        marginTop: 0
      }
    }
  })
}
