import React from 'react'

import {style} from 'typestyle'
import {ViewContext} from '../../api/newViewContext'
import {Spacing} from '../../ui/style'
import {QuickSearchFieldStyle, QuickSearchField} from '../../filter/ui/searchField'
import {SortFieldStyle, SortField} from '../../filter/ui/sortField'
import {SortConfigration, FilterFieldGroup} from '../../filter/configuration'
// import {Filter, Sort} from '../../api/karma'

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
  viewContext: ViewContext
  sortConfigurations: SortConfigration[]
  sortValue: SortConfigration
  sortDescending: boolean
  onSortChange: (value: SortConfigration, descending: boolean) => void
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
        <QuickSearchField
          value={this.props.quickSearchValue}
          onChange={this.props.onQuickSearchChange}
        />
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
