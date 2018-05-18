import * as React from 'react'

import { style } from 'typestyle'
import { Spacing, Color, FontWeight, FontSize } from '../../style'
import { marginTopExceptFirst, solidBorderWithColor } from '../../../util/style'
import { MarkerWidth } from '../../common'

export namespace PanelHeader {
  export interface Props {
    title?: React.ReactNode
    description?: React.ReactNode
    markerColor?: string
  }
}

export class PanelHeader extends React.Component<PanelHeader.Props> {
  public render() {
    return (
      <div className={PanelHeader.Style}>
        {this.props.markerColor && (
          <div className={`marker`} style={{backgroundColor: this.props.markerColor}} />
        )}
        <div className='content'>
          <div className='title'>{this.props.title}</div>
          {this.props.description && (
            <div className='description'>{this.props.description}</div>
          )}
        </div>
      </div>
    )
  }
}

export namespace PanelHeader {
  export const Style = style({
    $debugName: 'PanelHeader',

    width: '100%',

    backgroundColor: Color.neutral.light4,
    borderBottom: solidBorderWithColor(Color.neutral.light1),

    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,

    $nest: {
      '> .marker': {
        width: MarkerWidth,
        flexShrink: 0
      },
      '> .content': {
        padding: Spacing.medium,

        $nest: {
          '> .title': {
            fontSize: FontSize.largest,
            fontWeight: FontWeight.bold,
            color: Color.primary.base
          },

          '> .description': {
            fontWeight: FontWeight.light,
            fontStyle: 'italic',
            color: Color.primary.base,
            marginTop: Spacing.small,
            $nest: {'p': {margin: 0, ...marginTopExceptFirst(Spacing.small)}}
          }
        }
      }
    }
  })
}
