import * as React from 'react'

import {style} from 'typestyle'
import {Color, Spacing, FontSize, FontWeight} from '../../ui/style'

import {Button, ButtonType} from '../../ui/common'
import {IconName} from '../../ui/common/icon'
import {stringToColor} from '../../util/string'
import {LocaleContext, withLocale} from '../../context/locale'

export interface SidePanelFooterProps {
  username: string
  localeContext: LocaleContext
  onLogoutTrigger: () => void
}

export class SidePanelFooter extends React.Component<SidePanelFooterProps> {
  private handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.localeContext.setLocale(e.currentTarget.value)
  }

  public render() {
    const imageStyle: React.CSSProperties = {
      backgroundColor: `${stringToColor(this.props.username, 0.2, 0.4)}`,
      color: `${stringToColor(this.props.username, 0.5, 0.8)}`
    }

    return (
      <div className={SidePanelFooterStyle}>
        <div className="image" style={imageStyle}>
          {this.props.username[0].toUpperCase()}
        </div>
        <div className="info">
          <div className="username">{this.props.username}</div>
        </div>
        {/* TODO */}
        {/* <select onChange={this.handleLocaleChange} value={this.props.localeContext.locale}>
          {[...this.props.localeContext.localeMap.entries()].map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select> */}
        <Button
          type={ButtonType.Link}
          icon={IconName.Exit}
          onTrigger={this.props.onLogoutTrigger}
        />
      </div>
    )
  }
}

export const SidePanelFooterContainer = withLocale(SidePanelFooter)

export const SidePanelFooterStyle = style({
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
      flexShrink: 0,

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
      marginRight: Spacing.medium,

      whiteSpace: 'nowrap',
      overflow: 'hidden',

      $nest: {
        '> .username': {
          fontWeight: FontWeight.bold,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },

        '> .endpoint': {
          fontSize: FontSize.small,
          color: Color.neutral.dark1,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      }
    },

    [`> .${Button.Style}`]: {
      color: Color.neutral.white,
      fontSize: FontSize.large
    }
  }
})
