import React from 'react'

import {style} from 'typestyle'
import {ViewContext} from '../../api/karmafe/viewContext'
import {Spacing} from '../../ui/style'
import {EntryFilterStore} from '../../filter/stores/entryFilterStore'
import {Button, ButtonType} from '../../ui/common'
import {QuickSearchField, QuickSearchFieldStyle} from '../../filter/ui/searchField'
import {SortField, SortFieldStyle} from '../../filter/ui/sortField'
import {IconName} from '../../ui/common/icon'

export const EntryToolbarFilterStyle = style({
  display: 'flex',

  $nest: {
    [`> .${QuickSearchFieldStyle}`]: {
      marginRight: Spacing.largest
    },

    [`> .${SortFieldStyle}`]: {
      marginRight: Spacing.large,
      $nest: {'&:last-child': {marginRight: 0}}
    }
  }
})

export interface RecordListPanelToolbarProps {
  viewContext: ViewContext
  entryFilterStore: EntryFilterStore
}

export class RecordListPanelToolbar extends React.Component<RecordListPanelToolbarProps> {
  private handleFilterClick = () => {
    this.props.entryFilterStore.toggleFilterActive()
  }

  public render() {
    return (
      <div className={EntryToolbarFilterStyle}>
        <QuickSearchField store={this.props.entryFilterStore} />
        <SortField store={this.props.entryFilterStore} />
        {this.props.entryFilterStore.filterStores.length > 0 && (
          <Button
            icon={IconName.FilterList}
            type={ButtonType.Icon}
            onTrigger={this.handleFilterClick}
            selected={this.props.entryFilterStore.isFilterActive}
          />
        )}
      </div>
    )
  }
}
