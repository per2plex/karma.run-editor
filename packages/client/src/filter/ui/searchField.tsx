import * as React from 'react'
import { style } from 'typestyle'
import { observer } from 'mobx-react'

import { Color, FontWeight, Spacing } from '../../ui/style'
import { InputStyle, TextInput, TextInputType } from '../../ui/common'

import { EntryFilterStore } from '../stores/entryFilterStore'

export const QuickSearchFieldStyle = style({
  $debugName: 'QuickSearchFieldStyle',

  display: 'flex',
  alignItems: 'center',

  $nest: {
    '> .label': {
      flexShrink: 0,
      marginRight: Spacing.medium,
      // textTransform: 'uppercase',
      color: Color.primary.base,
      fontWeight: FontWeight.bold,
      fontSize: '1.5rem',
    },

    [`> .${InputStyle}`]: {
      width: '22rem'
    }
  }
})

export namespace QuickSearchField {
  export interface Props {
    store: EntryFilterStore
  }
}

@observer
export class QuickSearchField extends React.Component<QuickSearchField.Props> {
  private handleChange = (value: string) => {
    this.props.store.setSearchText(value)
  }

  public render() {
    return (
      <div className={QuickSearchFieldStyle}>
        <div className='label'>Search</div>
        <TextInput type={TextInputType.Light} value={this.props.store.searchText}
          onChange={this.handleChange}
          disabled={this.props.store.isFilterActive}
          placeholder='Search...' />
      </div>
    )
  }
}