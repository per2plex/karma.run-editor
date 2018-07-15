import * as React from 'react'
import {style} from 'typestyle'
import {Spacing, Color, FontSize, bottomShadow} from '../../style'
import {solidBorderWithColor} from '../../../util/style'

import {QuickSearchFieldStyle} from '../../../filter/ui/searchField'
import {SortFieldStyle} from '../../../filter/ui/sortField'

export interface PanelToolbarProps {
  left?: React.ReactNode
  right?: React.ReactNode
  drawer?: React.ReactNode
}

export class PanelToolbar extends React.PureComponent<PanelToolbarProps> {
  public render() {
    return (
      <div className={PanelToolbar.Style}>
        <div className="content">
          <div className="left">{this.props.left}</div>
          <div className="right">{this.props.right}</div>
        </div>
        {this.props.drawer && <div className="drawer">{this.props.drawer}</div>}
      </div>
    )
  }
}

export namespace PanelToolbar {
  export const Style = style({
    $debugName: 'PanelToolbar',

    position: 'sticky',
    top: 0,
    zIndex: 10,

    width: '100%',
    fontSize: FontSize.medium,

    backgroundColor: Color.neutral.light5,
    color: Color.neutral.dark2,
    borderBottom: solidBorderWithColor(Color.neutral.light1),

    $nest: {
      '> .content': {
        display: 'flex',
        alignItems: 'center',
        padding: Spacing.large,
        minHeight: '5rem',

        $nest: {
          '> .left': {
            flexGrow: 1
          },

          '> .right': {
            flexShrink: 0,

            display: 'flex',
            justifyContent: 'flex-end',

            $nest: {
              [`> .${QuickSearchFieldStyle}`]: {
                marginRight: Spacing.largest
              },

              [`> .${SortFieldStyle}`]: {
                marginRight: Spacing.large,
                $nest: {'&:last-child': {marginRight: 0}}
              }
            }
          }
        }
      },

      '> .drawer': {
        borderTop: solidBorderWithColor(Color.neutral.light1),
        padding: Spacing.medium
      },

      '&::after': bottomShadow(1)
    }
  })
}
