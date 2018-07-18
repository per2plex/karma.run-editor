import React from 'react'

import {
  Field,
  EditComponentRenderProps,
  FieldComponent,
  FieldLabel,
  SerializedField,
  SortConfiguration,
  FilterConfiguration,
  CardSection,
  ListRenderProps,
  EditRenderProps,
  Model,
  ErrorField,
  DropAreaFileInput,
  FlexList,
  FlexFiller,
  CardLabel,
  Icon,
  IconName,
  Card,
  CardImage,
  CardDocument,
  Config,
  withConfig,
  ListComponentRenderProps,
  SessionContext,
  withSession,
  SaveContext,
  DeleteContext
} from '@karma.run/editor-common'

import {expression as e} from '@karma.run/sdk'
import {UploadResponse, MediaType} from './interface'
import {Media, thumbnailURL} from './editor'
import {name} from './version'
import {uploadMedia, commitMedia, copyMedia, deleteMedia} from './api'

export function mediaAPIPath(basePath: string) {
  return `${basePath}/api/plugin/${name}`
}

export function thumbnailURLForValue(basePath: string, value: MediaFieldValue) {
  const uploadedMedia = value.uploadedMedia
  const media = value.media

  if (uploadedMedia) {
    if (uploadedMedia.mediaType !== MediaType.Image) return null
    return uploadedMedia.url
  }

  if (media) {
    if (media.mediaType !== MediaType.Image && media.mediaType !== MediaType.Video) {
      return null
    }

    return thumbnailURL(mediaAPIPath(basePath), media.id)
  }

  return null
}

export function extensionForValue(value: MediaFieldValue) {
  const uploadedMedia = value.uploadedMedia
  const media = value.media

  if (uploadedMedia) return uploadedMedia.extension
  if (media) return media.extension

  return '?'
}

export interface MediaFieldEditComponentProps
  extends EditComponentRenderProps<MediaField, MediaFieldValue> {
  config: Config
  sessionContext: SessionContext
}

export interface MediaFieldEditComponentState {
  isUploading: boolean
  progress: number
}

export class MediaFieldEditComponent extends React.PureComponent<
  MediaFieldEditComponentProps,
  MediaFieldEditComponentState
> {
  public state: MediaFieldEditComponentState = {
    isUploading: false,
    progress: 0
  }

  private handleDrop = async (file: File) => {
    try {
      const response = await uploadMedia(
        mediaAPIPath(this.props.config.basePath),
        file,
        this.props.sessionContext.session!.signature,
        (progress: number) => {
          this.setState({progress})
        }
      )

      this.props.onValueChange({...this.props.value, uploadedMedia: response}, this.props.changeKey)
    } catch (err) {
      // TODO: Handle error
      console.error(err)
    }
  }

  private handlePreviewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
  }

  public render() {
    let content: React.ReactNode

    if (this.state.isUploading) {
      content = `${this.state.progress * 100}%`
    } else if (this.props.value.media || this.props.value.uploadedMedia) {
      let name: string
      let url: string

      if (this.props.value.uploadedMedia) {
        name = `${this.props.value.uploadedMedia.filename}`
        url = this.props.value.uploadedMedia.url
      } else {
        name = `${this.props.value.media!.filename}`
        url = this.props.value.media!.url
      }

      const labelElement = (
        <CardSection>
          <FlexList>
            {name && <CardLabel text={name} />}
            <FlexFiller />
            {url && (
              <a href={url} target="_blank" onClick={this.handlePreviewClick}>
                <Icon name={IconName.Preview} />
              </a>
            )}
          </FlexList>
        </CardSection>
      )

      const thumbnailURL = thumbnailURLForValue(this.props.config.basePath, this.props.value)
      const extension = extensionForValue(this.props.value)

      if (thumbnailURL) {
        content = (
          <Card>
            <CardImage src={thumbnailURL!} />
            {labelElement}
          </Card>
        )
      } else {
        content = (
          <Card>
            <CardDocument extension={extension} />
            {labelElement}
          </Card>
        )
      }
    }

    return (
      <FieldComponent depth={this.props.depth} index={this.props.index}>
        {!this.props.isWrapped && (
          <FieldLabel
            label={this.props.label}
            description={this.props.description}
            depth={this.props.depth}
            index={this.props.index || 0}
          />
        )}
        <DropAreaFileInput text="Drop File Here" onFileDrop={this.handleDrop}>
          {content}
        </DropAreaFileInput>
      </FieldComponent>
    )
  }
}

export interface MediaFieldListComponentProps
  extends ListComponentRenderProps<MediaField, MediaFieldValue> {
  config: Config
}

export class MediaFieldListComponent extends React.PureComponent<MediaFieldListComponentProps> {
  public render() {
    const thumbnailURL = thumbnailURLForValue(this.props.config.basePath, this.props.value)
    const extension = extensionForValue(this.props.value)

    if (thumbnailURL) {
      return <CardImage src={thumbnailURL} />
    } else {
      return <CardDocument extension={extension} />
    }
  }
}

export const MediaFieldListContainer = withConfig(MediaFieldListComponent)
export const MediaFieldEditContainer = withSession(withConfig(MediaFieldEditComponent))

export interface MediaFieldOptions {
  readonly label?: string
  readonly description?: string
}

export type SerializedMediaField = SerializedField & MediaFieldOptions

export interface MediaFieldValue {
  media?: Media
  uploadedMedia?: UploadResponse
}

export class MediaField implements Field<MediaFieldValue> {
  public readonly label?: string
  public readonly description?: string

  public readonly defaultValue: MediaFieldValue = {}
  public readonly sortConfigurations: SortConfiguration[] = []
  public readonly filterConfigurations: FilterConfiguration[] = []

  public constructor(opts?: MediaFieldOptions) {
    this.label = opts && opts.label
    this.description = opts && opts.description
    this.sortConfigurations = []
  }

  public initialize() {
    return this
  }

  public renderListComponent(props: ListRenderProps<MediaFieldValue>) {
    return <MediaFieldListContainer field={this} {...props} />
  }

  public renderEditComponent(props: EditRenderProps<MediaFieldValue>) {
    return (
      <MediaFieldEditContainer
        label={this.label}
        description={this.description}
        field={this}
        {...props}
      />
    )
  }

  public transformRawValue(value: any) {
    return value
  }

  public transformValueToExpression(_value: MediaFieldValue) {
    return e.null() // TODO
  }

  public isValidValue() {
    return null
  }

  public serialize(): SerializedMediaField {
    return {
      type: MediaField.type,
      label: this.label,
      description: this.description
    }
  }

  public traverse() {
    return this
  }

  public valuePathForKeyPath() {
    return []
  }

  public async onSave(value: MediaFieldValue, context: SaveContext): Promise<MediaFieldValue> {
    const {media, uploadedMedia} = value
    const apiPath = mediaAPIPath(context.config.basePath)
    const signature = context.sessionContext.session!.signature
    const isNew = context.id == undefined

    if (uploadedMedia) {
      const response = await commitMedia(
        apiPath,
        uploadedMedia.id,
        !isNew && media ? media.id : undefined,
        signature
      )

      return {media: response}
    } else if (isNew && media) {
      const response = await copyMedia(apiPath, media.id, signature)
      return {media: {...media, ...response}}
    }

    return {media}
  }

  public async onDelete(value: MediaFieldValue, context: DeleteContext): Promise<MediaFieldValue> {
    const {media} = value
    const apiPath = mediaAPIPath(context.config.basePath)
    const signature = context.sessionContext.session!.signature

    if (media) await deleteMedia(apiPath, media.id, signature)

    return {}
  }

  public static type = 'media'

  static canInferFromModel(model: Model) {
    if (model.type === 'annotation' && model.value === 'field:media') {
      return true
    }

    // TODO: Infer from struct structure
    return false
  }

  static create(model: Model, opts?: MediaFieldOptions) {
    if (model.type === 'annotation') {
      model = model.model
    }

    if (model.type !== 'struct') {
      return new ErrorField({
        label: opts && opts.label,
        description: opts && opts.description,
        message: `Expected model type "struct" received: "${model.type}"`
      })
    }

    return new this(opts)
  }

  static unserialize(rawField: SerializedMediaField) {
    return new this({
      label: rawField.label,
      description: rawField.description
    })
  }
}
