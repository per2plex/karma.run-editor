import * as React from 'react'
import {style} from 'typestyle'
import {boolAttr} from '../../util/react'
import {FontWeight, Color, Spacing, DefaultBorderRadiusPx, FontFamily} from '../style'
import {SpaceKeyCode} from '../../util/keyCodes'
import {AppLocation, urlPathForLocation} from '../../store/locationStore'
import {solidBorderWithColor} from '../../util/style'
import {Icon, IconName} from '../common/icon'

export interface ButtonBaseProps {
  icon?: IconName
  type?: ButtonType
  label?: string
  data?: any
  selected?: boolean
  disabled?: boolean
}

export const enum ButtonType {
  Primary = 'dark',
  Light = 'light',
  Link = 'link',
  Icon = 'icon'
}

export namespace Button {
  export interface Props extends ButtonBaseProps {
    onTrigger?: (data?: any) => void
    onMouseDown?: (data?: any) => void
  }
}

export class Button extends React.Component<Button.Props> {
  private handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (this.props.onTrigger) this.props.onTrigger(this.props.data)
  }

  private handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (this.props.onMouseDown) this.props.onMouseDown(this.props.data)
  }

  public render() {
    return (
      <button
        className={`${Button.Style} ${buttonStyleForType(this.props.type)}`}
        disabled={this.props.disabled}
        data-active={boolAttr(this.props.selected)}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>
        <span className="content">
          {this.props.icon && <Icon name={this.props.icon} />}
          {this.props.label && <span className="label">{this.props.label}</span>}
        </span>
      </button>
    )
  }
}

export namespace LocationButton {
  export interface Props extends ButtonBaseProps {
    location: AppLocation
    onTrigger: (location: AppLocation) => void
  }

  export interface State {
    isActive: boolean
  }
}

export class LocationButton extends React.Component<LocationButton.Props, LocationButton.State> {
  state: LocationButton.State = {
    isActive: false
  }

  private handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    this.props.onTrigger(this.props.location)
  }

  private handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.keyCode === SpaceKeyCode) {
      this.setState({isActive: true})
    }
  }

  private handleKeyUp = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.keyCode === SpaceKeyCode) {
      e.preventDefault()
      this.setState({isActive: false})
      this.props.onTrigger(this.props.location)
    }
  }

  public render() {
    return (
      <a
        className={`${Button.Style} ${buttonStyleForType(this.props.type)}`}
        data-disabled={boolAttr(this.props.disabled)}
        data-active={boolAttr(this.state.isActive)}
        href={urlPathForLocation(this.props.location)}
        role="button"
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        onClick={this.handleClick}>
        <span className="content">
          {this.props.icon && <Icon name={this.props.icon} />}
          {this.props.label && <span className="label">{this.props.label}</span>}
        </span>
      </a>
    )
  }
}

export namespace Button {
  export const Style = style({
    $debugName: 'Button',

    cursor: 'pointer',

    fontFamily: FontFamily.primary,
    fontSize: '1em',
    lineHeight: 1.2,

    flexShrink: 0,
    flexGrow: 0,
    padding: 0,

    $nest: {
      '> .content': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        $nest: {
          [`> .${Icon.Style}`]: {
            marginRight: Spacing.small,

            $nest: {
              '&:only-child': {marginRight: 0}
            }
          }
        }
      },

      '&:disabled, &[data-disabled]': {
        cursor: 'default',
        pointerEvents: 'none',
        opacity: 0.6
      },

      '&:focus': {
        outline: 'none'
      },

      '&, &:link, &:visited': {
        border: 'none',
        backgroundColor: 'transparent',
        color: Color.neutral.black
      }
    }
  })

  export const PrimaryStyle = style({
    $debugName: 'ButtonPrimary',

    border: solidBorderWithColor(Color.primary.base),
    backgroundColor: Color.primary.light1,

    padding: `${Spacing.small} ${Spacing.medium}`,
    borderRadius: DefaultBorderRadiusPx,

    $nest: {
      '&:hover': {
        borderColor: Color.neutral.base,
        backgroundColor: Color.neutral.light1
      },

      '&:active, &[data-active]': {
        borderColor: Color.neutral.dark1,
        backgroundColor: Color.neutral.base
      },

      '&:hover, &:active, &[data-active]': {
        color: Color.primary.light1
      },

      '&:focus': {
        boxShadow: `0 0 0 2px ${Color.focus}`
      },

      '&, &:link, &:visited': {
        color: Color.neutral.light5
      },

      '> .content': {
        $nest: {
          [`> .${Icon.Style}`]: {
            fill: Color.neutral.light5
          }
        }
      }
    }
  })

  export const Light = style({
    $debugName: 'ButtonLight',

    border: solidBorderWithColor(Color.primary.base),
    backgroundColor: Color.neutral.light5,

    padding: `${Spacing.small} ${Spacing.medium}`,
    borderRadius: DefaultBorderRadiusPx,

    $nest: {
      '&:hover': {
        borderColor: Color.neutral.base,
        backgroundColor: Color.neutral.light1
      },

      '&:active, &[data-active]': {
        borderColor: Color.neutral.dark1,
        backgroundColor: Color.neutral.base
      },

      '&:hover, &:active, &[data-active]': {
        color: Color.primary.light1
      },

      '&:focus': {
        boxShadow: `0 0 0 2px ${Color.focus}`
      },

      '&, &:link, &:visited': {
        color: Color.primary.light1
      },

      '> .content': {
        $nest: {
          [`> .${Icon.Style}`]: {
            fill: Color.primary.light1
          }
        }
      }
    }
  })

  export const IconStyle = style({
    $debugName: 'ButtonIcon',

    display: 'flex',
    alignItems: 'center',

    $nest: {
      '&:focus': {
        boxShadow: 'none'
      },

      '&:hover > .content > .label, &:active > .content > .label, &[data-active] > .content > .label': {
        color: Color.primary.light3
      },

      [`&:hover > .content > .${Icon.Style}, &:active > .content > .${
        Icon.Style
      }, &[data-active] > .content > .${Icon.Style}`]: {
        fill: Color.primary.light3
      },

      '> .content': {
        $nest: {
          '> .label': {
            color: Color.primary.base,
            fontWeight: FontWeight.bold
          },

          [`> .${Icon.Style}`]: {
            fill: Color.primary.base,
            fontSize: '1.4em'
          }
        }
      }
    }
  })

  export const LinkStyle = style({
    $debugName: 'ButtonLink',

    $nest: {
      [`.${Icon.Style}`]: {
        fill: Color.neutral.white
      }
    }
  })
}

function buttonStyleForType(type?: ButtonType) {
  switch (type) {
    case ButtonType.Link:
      return Button.LinkStyle
    case ButtonType.Icon:
      return Button.IconStyle
    case ButtonType.Light:
      return Button.Light

    default:
    case ButtonType.Primary:
      return Button.PrimaryStyle
  }
}
