import * as React from 'react'
import {style} from 'typestyle'
import {observer} from 'mobx-react'

import {Spacing} from '../../ui/style'
import {InputStyle} from '../../ui/common'

import {EntryFilterStore} from '../stores/entryFilterStore'
import {FilterRow, FilterRowStyle} from './filterRow'
import {marginTopExceptFirst} from '../../util/style'

export const FilterListStyle = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',

  $nest: {
    '> .label': {
      flexShrink: 0,
      marginRight: Spacing.medium
    },

    [`> .${InputStyle}`]: {
      width: 'auto'
    },

    [`> .${FilterRowStyle}`]: marginTopExceptFirst(Spacing.medium)
  }
})

export namespace FilterList {
  export interface Props {
    store: EntryFilterStore
    onEntryChoose: (model: string) => Promise<string | undefined>
  }
}

@observer
export class FilterList extends React.Component<FilterList.Props> {
  private handleAddAtIndex = (index: number) => {
    this.props.store.addFilterStoreAtIndex(index + 1)
  }

  private handleRemoveAtIndex = (index: number) => {
    this.props.store.removeFilterStoreAtIndex(index)
  }

  public render() {
    return (
      <div className={FilterListStyle}>
        {this.props.store.filterStores.map((filterStore, index) => (
          <FilterRow
            key={filterStore.id}
            index={index}
            store={filterStore}
            onAdd={this.handleAddAtIndex}
            onRemove={
              this.props.store.filterStores.length !== 1 ? this.handleRemoveAtIndex : undefined
            }
            onEntryChoose={this.props.onEntryChoose}
          />
        ))}
      </div>
    )
  }
}
