import * as React from 'react'
import Fuse from 'fuse.js'
import {uniqueFilter} from '@karma.run/editor-common'
import {Ref} from '@karma.run/sdk'
import {style} from 'typestyle'

import * as storage from '../../util/storage'
import {Color, Spacing, FontWeight, DefaultBorderRadiusPx} from '../../ui/style'

import {Select, SelectType} from '../../ui/common'
import {Colors, Theme, withTheme} from '../../context/theme'

import {EntryListLocation, withLocationAction, LocationActionContext} from '../../context/location'

import {SearchInput} from '../../ui/common/searchInput'
import {convertKeyToLabel} from '../../util/string'
import {version} from '../../version'
import {withSession, SessionContext} from '../../context/session'
import {refToString, ReadonlyRefMap} from '../../util/ref'
import {EditorContext} from '../../api/editorContext'
import {ModelGroup} from '../../api/modelGroup'
import {SidePanelFooterContainer} from './footer'
import {SidePanelSection, SidePanelSectionItem} from './section'
import {ViewContext} from '../../api/viewContext'
import memoizeOne from 'memoize-one'

export const GroupStateStorageKey = 'sidePanelGroupState_v1'

export interface FuseSearchItem {
  name: string
  slug: string
  model: Ref
}

export interface SidePanelState {
  searchValue: string
  searchResults: FuseSearchItem[]
  groupState: {[id: string]: boolean}
  editorContext: EditorContext
}

export interface SidePanelProps {
  theme: Theme
  sessionContext: SessionContext
  locationActionContext: LocationActionContext
}

export class SidePanel extends React.PureComponent<SidePanelProps, SidePanelState> {
  constructor(props: SidePanelProps) {
    super(props)
    this.state = {
      searchValue: '',
      searchResults: [],
      groupState: storage.get(GroupStateStorageKey) || {},
      editorContext: props.sessionContext.editorContexts[0]
    }
  }

  private handleLogoutClick = () => {
    this.props.sessionContext.invalidate()
  }

  private handleGroupClick = (id: string) => {
    this.toggleGroup(id)
  }

  private handleViewContextClick = (href: string) => {
    this.props.locationActionContext.pushLocation(
      this.props.locationActionContext.locationForURLPath(href)
    )
  }

  private handleEditorContextChange = (id?: string) => {
    if (!id) return

    const editorContext = this.props.sessionContext.editorContextMap.get(id)

    if (editorContext) {
      this.setState({editorContext})
    }
  }
  private handleSearchChange = (searchValue: string) => {
    const fuseInstance = this.getFuseInstance(
      this.state.editorContext,
      this.props.sessionContext.modelGroupMap,
      this.props.sessionContext.viewContextMap
    )

    const searchResults = fuseInstance.search<FuseSearchItem>(searchValue).slice(0, 5)
    this.setState({searchValue, searchResults})
  }

  private handleSearchItemClick = (item: SearchInput.ResultItem) => {
    this.setState({searchValue: '', searchResults: []})
    this.handleViewContextClick(item.href)
  }

  private toggleGroup(id: string) {
    const isOpen = this.state.groupState[id]
    const newGroupState = {...this.state.groupState, [id]: !isOpen}
    this.setState({groupState: newGroupState})

    storage.set(GroupStateStorageKey, newGroupState)
  }

  private getFuseInstance = memoizeOne(
    (
      editorContext: EditorContext,
      modelGroupMap: ReadonlyRefMap<ModelGroup>,
      viewContextMap: ReadonlyRefMap<ViewContext>
    ) => {
      const groups = this.getActiveModelGroups(editorContext, modelGroupMap)
      const modelIDs = groups
        .map(group => group.models.map(model => refToString(model)))
        .reduce((acc, models) => acc.concat(models))
        .filter(uniqueFilter)

      const viewContexts = modelIDs
        .map(modelID => viewContextMap.get(modelID))
        .filter(viewContext => viewContext != undefined) as ViewContext[]

      const searchItems: FuseSearchItem[] = viewContexts.map(viewContext => ({
        name: viewContext.name,
        slug: viewContext.slug,
        model: viewContext.model
      }))

      return new Fuse(searchItems, {
        shouldSort: true,
        tokenize: true,
        matchAllTokens: false,
        location: 0,
        distance: 50,
        threshold: 0.5,
        keys: ['name']
      })
    }
  )

  private getActiveModelGroups = memoizeOne(
    (editorContext: EditorContext, modelGroupMap: ReadonlyRefMap<ModelGroup>) => {
      return editorContext.modelGroups
        .map(modelGroupID => modelGroupMap.get(modelGroupID))
        .filter(modelGroup => modelGroup != undefined) as ModelGroup[]
    }
  )

  public render() {
    const sessionContext = this.props.sessionContext
    const groups = this.getActiveModelGroups(this.state.editorContext, sessionContext.modelGroupMap)

    const groupSections = groups.map(group => {
      const items: SidePanelSectionItem[] = group.models.map(model => {
        const viewContext = sessionContext.viewContextMap.get(model)

        if (!viewContext) {
          const tag = sessionContext.reverseTagMap.get(model)
          const label = tag ? convertKeyToLabel(tag) : refToString(model)
          return {id: `noPermission_${model}`, label}
        }

        return {
          id: refToString(viewContext.model),
          label: viewContext.name,
          href: this.props.locationActionContext.urlPathForLocation(
            EntryListLocation(viewContext.slug)
          )
        }
      })

      return (
        <SidePanelSection
          key={group.id}
          id={group.id}
          isOpen={this.state.groupState[group.id]}
          onClick={this.handleGroupClick}
          onItemClick={this.handleViewContextClick}
          items={items}
          label={group.name}
          icon={''}
        />
      )
    })

    let editorContextSelect: React.ReactNode

    if (sessionContext.editorContexts.length > 1) {
      const editorContextOptions = sessionContext.editorContexts.map(context => ({
        key: context.id,
        label: context.name
      }))

      editorContextSelect = (
        <Select
          options={editorContextOptions}
          type={SelectType.Light}
          value={this.state.editorContext.id}
          disableUnselectedOption
          onChange={this.handleEditorContextChange}
        />
      )
    }

    const searchInputResults: SearchInput.ResultItem[] = this.state.searchResults.map(
      searchResult => ({
        id: searchResult.model,
        title: searchResult.name,
        subtitle: searchResult.slug,
        href: this.props.locationActionContext.urlPathForLocation(
          EntryListLocation(searchResult.slug)
        )
      })
    )

    return (
      <div className={SidePanelStyle(this.props.theme.colors)}>
        <div className="content">
          <div className="header">
            <div className="logo" title={`v${version}`}>
              <this.props.theme.logo />
            </div>
            <SearchInput
              onChange={this.handleSearchChange}
              onItemSubmit={this.handleSearchItemClick}
              value={this.state.searchValue}
              placeholder="Search..."
              results={searchInputResults}
            />
          </div>
          <div className="modelGroups">{groupSections}</div>
          {editorContextSelect}
        </div>
        <SidePanelFooterContainer
          username={sessionContext.session!.username}
          onLogoutTrigger={this.handleLogoutClick}
        />
      </div>
    )
  }
}

export const SidePanelContainer = withSession(withLocationAction(withTheme(SidePanel)))

export const SidePanelStyle = (colors: Colors) =>
  style({
    $debugName: 'SidePanel',

    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    alignItems: 'center',

    height: '100%',
    width: '26rem',

    backgroundColor: colors.primary,

    $nest: {
      '> .content': {
        display: 'flex',
        flexDirection: 'column',
        padding: Spacing.larger,
        height: '100%',
        width: '100%',

        $nest: {
          '> .header': {
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            marginBottom: Spacing.largest,
            fontSize: '1.1em',

            $nest: {
              '> .logo': {
                height: '10rem',
                marginTop: Spacing.medium,
                marginBottom: Spacing.largest,
                textAlign: 'center',

                $nest: {
                  '> svg': {
                    fill: Color.neutral.white,
                    height: '100%'
                  }
                }
              }
            }
          },

          '> .modelGroups': {
            paddingRight: Spacing.larger,
            marginBottom: Spacing.largest,

            overflowY: 'auto',
            width: '100%',
            flexGrow: 1,
            fontWeight: FontWeight.medium,

            $nest: {
              '&::-webkit-scrollbar-track': {
                borderRadius: DefaultBorderRadiusPx,
                backgroundColor: Color.primary.light1
              },

              '&::-webkit-scrollbar': {
                width: '0.5rem',
                backgroundColor: 'transparent'
              },

              '&::-webkit-scrollbar-thumb': {
                borderRadius: DefaultBorderRadiusPx,
                backgroundColor: Color.neutral.white
              }
            }
          }
        }
      }
    }
  })
