import React from 'react'

import {style} from 'typestyle'
import {ViewContext} from '../../api/karmafe/viewContext'
import {Spacing} from '../../ui/style'
import {QuickSearchFieldStyle} from '../../filter/ui/searchField'
import {SortFieldStyle} from '../../filter/ui/sortField'

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
}

export interface ToolbarFilterState {}

export class ToolbarFilter extends React.Component<ToolbarProps> {
  // private handleFilterClick = () => {
  //   // this.props.entryFilterStore.toggleFilterActive()
  // }

  public render() {
    return (
      <div className={ToolbarFilterStyle}>
        {/* <QuickSearchField store={this.props.entryFilterStore} />
        <SortField store={this.props.entryFilterStore} />
        {this.props.entryFilterStore.filterStores.length > 0 && (
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
