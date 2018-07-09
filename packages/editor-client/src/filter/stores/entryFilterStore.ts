import {observable, runInAction, action, reaction, IObservableArray} from 'mobx'

import {filterAndSortObjects} from '../'
import {debounce} from '../../util/functional'
import {ViewContext} from '../../api/viewContext'
import {IReactionDisposer} from 'mobx/lib/core/reaction'

import {
  SortConfiguration,
  FilterFieldGroup,
  sortConfigurationsForViewContext,
  filterConfigurationsForViewContext
} from '../configuration'

import {Filter, CompositeFilter, FullTextFilter} from '@karma.run/editor-common'
import {FilterStore} from './filterStore'
import {ModelRecord} from '../../context/session'

export {IObservableArray}

export type Entry = ModelRecord

export class EntryFilterStore {
  public filterStores = observable.shallowArray<FilterStore>()

  public sortConfigurations: SortConfiguration[]
  public filterConfigurations: FilterFieldGroup[]

  @observable.ref public searchText: string = ''
  @observable.ref public selectedSortIndex: number = 0
  @observable.ref public shouldSortDescending: boolean = false
  @observable.ref public isFilterActive: boolean = false
  @observable.ref public entries?: Entry[]

  @observable.ref public isLoading: boolean = false
  public filteredEntries = observable.shallowArray<Entry>()

  private disposeReaction: IReactionDisposer

  constructor(viewContext: ViewContext) {
    this.sortConfigurations = sortConfigurationsForViewContext(viewContext)
    this.filterConfigurations = filterConfigurationsForViewContext(viewContext)

    this.filterStores.push(new FilterStore(this.filterConfigurations))

    this.disposeReaction = reaction(
      () => ({
        entries: this.entries,
        searchText: this.searchText,
        sortIndex: this.selectedSortIndex,
        descending: this.shouldSortDescending,
        isFilterActive: this.isFilterActive,
        filters: this.filterStores.map(store => store.filter)
      }),
      () => {
        runInAction(() => {
          this.isLoading = true
          this.updateFilteredEntries()
        })
      }
    )
  }

  public dispose() {
    this.disposeReaction()
  }

  @action
  public setSelectedSortIndex(index: number) {
    this.selectedSortIndex = index
  }

  @action
  public setSortDescending(descending: boolean) {
    this.shouldSortDescending = descending
  }

  @action
  public toggleSortDescending() {
    this.shouldSortDescending = !this.shouldSortDescending
  }

  @action
  public setFilterActive(active: boolean) {
    this.isFilterActive = active
  }

  @action
  public toggleFilterActive() {
    this.isFilterActive = !this.isFilterActive
  }

  @action
  public setSearchText(text: string) {
    this.searchText = text
  }

  @action
  public addFilterStoreAtIndex(index: number) {
    this.filterStores.splice(index, 0, new FilterStore(this.filterConfigurations))
  }

  @action
  public removeFilterStoreAtIndex(index: number) {
    this.filterStores.splice(index, 1)
  }

  @action
  private updateFilteredEntries = debounce(
    async () => {
      if (!this.entries) return

      let filter: Filter | undefined

      if (this.isFilterActive) {
        filter = CompositeFilter(
          this.filterStores.filter(store => store.filter != undefined).map(store => store.filter!)
        )
      } else if (this.searchText) {
        filter = FullTextFilter(this.searchText)
      }

      const sortConfiguration = this.sortConfigurations[this.selectedSortIndex]

      const sort = {
        descending: this.shouldSortDescending,
        type: sortConfiguration.type,
        path: sortConfiguration.path
      }

      const entries = await filterAndSortObjects(filter, sort, this.entries)

      runInAction(() => {
        this.filteredEntries.clear()
        this.filteredEntries.push(...entries)
        this.isLoading = false
      })
    },
    250,
    false
  )
}
