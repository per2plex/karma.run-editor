import * as React from 'react'
import { style } from 'typestyle'
import { observer } from 'mobx-react'

import * as storage from '../util/storage'
import { Color, Spacing, FontSize, FontWeight, DefaultBorderRadiusPx } from '../ui/style'

import { Button, Select, ButtonType, SelectType } from '../ui/common'

import { ThemeContext, ColorScheme } from '../context/theme'
import { LocationStore, urlPathForLocation, locationForURLPath, EntryListLocation } from '../store/locationStore'
import { Icon, IconName } from '../ui/common/icon'
import { EditorStore } from '../store/editorStore'
import { SearchInput } from '../ui/common/searchInput'
import { convertKeyToLabel, stringToColor } from '../util/string'
import { version } from '../version'

export const GroupStateStorageKey = 'sidePanelGroupState_v1'

export namespace SidePanel {
  export interface State {
    searchValue: string
    searchResult: {name: string, model: string, slug: string}[]
    groupState: {[id: string]: boolean}
  }

  export interface Props {
    editorStore: EditorStore
    locationStore: LocationStore
  }
}

@observer
export class SidePanel extends React.Component<SidePanel.Props, SidePanel.State> {
  constructor(props: SidePanel.Props) {
    super(props)
    this.state = {
      searchValue: '',
      searchResult: [],
      groupState: storage.get(GroupStateStorageKey) || {}
    }
  }

  private handleLogoutClick = () => {
    this.props.editorStore.destroySession()
  }

  private handleGroupClick = (id: string) => {
    this.toggleGroup(id)
  }

  private handleViewContextClick = (href: string) => {
    this.props.locationStore.pushLocation(locationForURLPath(href))
  }

  private handleEditorContextChange = (id?: string | number) => {
    this.props.editorStore.activeEditorContextID = id!.toString()
  }

  private handleSearchChange = (searchValue: string) => {
    const searchResult = this.props.editorStore.searchModel(searchValue).slice(0, 5)
    this.setState({searchValue, searchResult})
  }

  private toggleGroup(id: string) {
    const isOpen = this.state.groupState[id]
    const newGroupState = {...this.state.groupState, [id]: !isOpen}
    this.setState({groupState: newGroupState})

    storage.set(GroupStateStorageKey, newGroupState)
  }

  private handleSearchItemClick = (item: SearchInput.ResultItem) => {
    this.setState({searchValue: '', searchResult: []})
    this.handleViewContextClick(item.href!)
  }

  public render() {
    const groups = this.props.editorStore.activeModelGroups
    const groupSections = groups.map(group => {
      const items: SidePanelSection.Item[] = group.models.map(model => {
        const viewContext = this.props.editorStore.viewContextMap[model]

        if (!viewContext) {
          const tag = this.props.editorStore.reverseTags[model]
          const label = tag ? convertKeyToLabel(tag) : model
          return {id: `noPermission_${model}`, label}
        }

        return {
          id: viewContext.model,
          icon: viewContext.icon,
          label: viewContext.name || viewContext.model,
          href: urlPathForLocation(EntryListLocation(viewContext.slug || viewContext.model)),
        }
      })

      return (
        <SidePanelSection key={group.id} id={group.id}
          isOpen={this.state.groupState[group.id]}
          onClick={this.handleGroupClick}
          onItemClick={this.handleViewContextClick}
          items={items} label={group.name} icon={''} />
      )
    })

    let editorContextSelect: React.ReactNode

    if (this.props.editorStore.editorContexts.length > 1) {
      const editorContextOptions = this.props.editorStore.editorContexts.map(context => ({
        key: context.id,
        label: context.name
      }))

      editorContextSelect = (
        <Select options={editorContextOptions}
          type={SelectType.Light}
          value={this.props.editorStore.activeEditorContextID}
          disableUnselectedOption
          onChange={this.handleEditorContextChange} />
      )
    }

    const searchInputResults = this.state.searchResult.map(searchResult => ({
      id: searchResult.model,
      title: searchResult.name,
      subtitle: searchResult.slug,
      href: urlPathForLocation(EntryListLocation(searchResult.slug))
    }) as SearchInput.ResultItem)

    return (
      <ThemeContext.Consumer>
        {context =>
          <div className={SidePanel.Style(context.colorScheme)}>
            <div className='wrapper'>
              <div className='content'>
                <div className='header'>
                  <div className='logo'>
                    <context.smallLogo />
                  </div>
                  <div className='version'>Version {version}</div>
                  <SearchInput onChange={this.handleSearchChange} onItemSubmit={this.handleSearchItemClick}
                  value={this.state.searchValue} placeholder='Search...'
                  results={searchInputResults} />
                </div>
                <div className='viewContexts'>
                  {groupSections}
                </div>
                {editorContextSelect}
              </div>
              <SidePanelFooter
                username={this.props.editorStore.session!.username}
                endpoint={this.props.editorStore.session!.database || this.props.editorStore.session!.endpoint}
                onLogoutTrigger={this.handleLogoutClick} />
            </div>
          </div>
        }
      </ThemeContext.Consumer>
    )
  }
}
export namespace SidePanel {
  export const Style = (colors: ColorScheme) => style({
    $debugName: 'SidePanel',

    display: 'flex',
    flexDirection: 'column',

    flexShrink: 0,
    height: '100%',
    width: '26rem',

    backgroundColor: colors.primary,

    $nest: {
      '> .wrapper': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',

        width: '100%',
        height: '100%',

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
                paddingTop: Spacing.large,
                marginBottom: Spacing.huger,
                fontSize: '1.1em',

                $nest: {
                  '> .logo': {
                    height: '10rem',
                    marginBottom: Spacing.larger,
                    textAlign: 'center',

                    $nest: {
                      '> svg': {
                        fill: Color.neutral.white,
                        height: '100%'
                      }
                    }
                  },

                  '> .version': {
                    fontSize: '1rem',
                    fontWeight: FontWeight.medium,
                    // textTransform: 'uppercase',
                    textAlign: 'center',
                    color: Color.neutral.base,
                    marginBottom: Spacing.huge,
                  }
                }
              },

              '> .viewContexts': {
                paddingRight: Spacing.larger,
                marginBottom: Spacing.huger,
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
      }
    }
  })
}

export namespace SidePanelSection {
  export interface Item {
    id: string,
    label: string
    href?: string
    icon?: string
  }

  export interface Props {
    id: string
    items: Item[]
    label: string
    icon: string
    isOpen: boolean
    onClick: (id: string) => void
    onItemClick: (href: string) => void
  }
}

@observer
export class SidePanelSection extends React.Component<SidePanelSection.Props> {
  private handleHeaderClick = () => {
    this.props.onClick(this.props.id)
  }

  private handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (e.currentTarget.href) this.props.onItemClick(e.currentTarget.href)
  }

  public render() {
    let content: React.ReactNode

    if (this.props.isOpen) {
      const items = this.props.items.map(item => (
        <a className='item'
          key={item.id} href={item.href}
          onClick={this.handleItemClick}>
          {item.label}
        </a>
      ))

      content = (
        <div className='content'>
          {items}
        </div>
      )
    }

    return (
      <div className={SidePanelSection.Style}>
        <div className='header' onClick={this.handleHeaderClick}>
          <Icon name={this.props.isOpen ? IconName.SectionCollapse : IconName.SectionUncollapse} />
          {this.props.label}
        </div>
        <div className='itemWrapper'>
          {content}
        </div>
      </div>
    )
  }
}

export namespace SidePanelSection {
  export const Style = style({
    $debugName: 'SidePanelSection',

    marginBottom: Spacing.larger,
    fontSize: '1.6rem',

    $nest: {
      '> .header': {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: FontWeight.medium,
        // textTransform: 'uppercase',

        $nest: {
          [`> .${Icon.Style}`]: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            fill: Color.neutral.white,
            marginRight: Spacing.medium
          }
        }
      },

      '> .itemWrapper': {
        marginTop: Spacing.large,
        paddingLeft: Spacing.largest,

        $nest: {
          '> .content': {
            display: 'flex',
            flexDirection: 'column',

            $nest: {
              '> .item': {
                fontSize: '0.9em',
                marginBottom: Spacing.medium,
                width: '100%',
                opacity: 0.5,

                $nest: {
                  '&[href]': {
                    opacity: 1,
                  }
                }
              }
            }
          }
        }
      }
    }
  })
}

export namespace SidePanelFooter {
  export interface Props {
    username: string
    endpoint: string
    onLogoutTrigger: () => void
  }
}

export class SidePanelFooter extends React.Component<SidePanelFooter.Props> {
  public render() {
    const imageStyle: React.CSSProperties = {
      backgroundColor: `${stringToColor(this.props.username, 0.2, 0.4)}`,
      color: `${stringToColor(this.props.username, 0.5, 0.8)}`
    }

    return (
      <div className={SidePanelFooter.Style}>
        <div className='image' style={imageStyle}>
          {this.props.username[0].toUpperCase()}
        </div>
        <div className='info'>
          <div className='username'>{this.props.username}</div>
          <div className='endpoint'>{this.props.endpoint}</div>
        </div>
        <Button type={ButtonType.Link} icon={IconName.Exit} onTrigger={this.props.onLogoutTrigger} />
      </div>
    )
  }
}

export namespace SidePanelFooter {
  export const Style = style({
    $debugName: 'SidePanelFooter',

    backgroundColor: Color.primary.dark1,
    padding: Spacing.medium,

    display: 'flex',
    alignItems: 'center',

    width: '100%',

    $nest: {
      '> .image': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        width: '3rem',
        height: '3rem',
        marginRight: Spacing.medium,

        borderRadius: '100%',
        backgroundColor: Color.neutral.dark1,

        fontSize: '1.5rem',
        fontWeight: FontWeight.bold
      },

      '> .info': {
        flexGrow: 1,

        $nest: {
          '> .username': {
            fontWeight: FontWeight.bold
          },

          '> .endpoint': {
            fontSize: FontSize.small,
            color: Color.neutral.dark1
          }
        }
      },

      [`> .${Button.Style}`]: {
        color: Color.neutral.white,
        fontSize: FontSize.large
      }
    },
  })
}
