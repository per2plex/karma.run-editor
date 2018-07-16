import React from 'react'
import {style} from 'typestyle'
import {ViewContext, SortConfiguration, FilterFieldGroup, Spacing} from '@karma.run/editor-common'

import {QuickSearchFieldStyle, QuickSearchField} from '../../filter/ui/searchField'
import {SortFieldStyle, SortField} from '../../filter/ui/sortField'

export const ToolbarFilterStyle = style({
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

export interface ToolbarProps {
  disableQuickSearch: boolean
  viewContext: ViewContext
  sortConfigurations: SortConfiguration[]
  sortValue: SortConfiguration
  sortDescending: boolean
  onSortChange: (value: SortConfiguration, descending: boolean) => void
  filterConfigurations: FilterFieldGroup[]
  quickSearchValue: string
  onQuickSearchChange: (value: string) => void

  // filter?: Filter
  // sorting?: Sort
  // onFilterChange: (filter: Filter) => void
}

export interface ToolbarFilterState {}

export class ToolbarFilter extends React.Component<ToolbarProps> {
  // private handleFilterClick = () => {
  //   // this.props.entryFilterStore.toggleFilterActive()
  // }

  public render() {
    return (
      <div className={ToolbarFilterStyle}>
        {!this.props.disableQuickSearch && (
          <QuickSearchField
            value={this.props.quickSearchValue}
            onChange={this.props.onQuickSearchChange}
          />
        )}
        <SortField
          configurations={this.props.sortConfigurations}
          value={this.props.sortValue}
          descending={this.props.sortDescending}
          onChange={this.props.onSortChange}
        />
        {/* {this.props.entryFilterStore.filterStores.length > 0 && (
          <Button
            icon={IconName.FilterList}
            type={ButtonType.Icon}
            onTrigger={this.handleFilterClick}
            selected={this.props.entryFilterStore.isFilterActive}
          />
        )} */}
      </div>
    )
  }
}
