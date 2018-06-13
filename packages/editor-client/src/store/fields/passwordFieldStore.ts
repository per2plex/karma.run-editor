import {computed, observable, action} from 'mobx'
import {FieldStore, FieldStoreOptions} from './fieldStore'
import {generateHash} from '../../util/bcrypt'
import {hashString} from '../../util/string'

export interface PasswordFieldStoreOptions extends FieldStoreOptions {
  costFactor?: number
  value?: string
}

export class PasswordFieldStore implements FieldStore {
  @observable.ref public value: string | undefined
  @observable.ref public password: string
  @observable.ref public passwordConfirm: string

  public readonly label?: string
  public readonly description?: string
  public readonly icon?: string
  public readonly costFactor?: number

  constructor(opts: PasswordFieldStoreOptions) {
    this.value = opts.value
    this.label = opts.label
    this.description = opts.description
    this.icon = opts.icon

    this.password = ''
    this.passwordConfirm = ''
    this.costFactor = opts.costFactor
  }

  @computed
  public get hash() {
    if (!this.password) return hashString(`password:${this.value || ''}`)
    return hashString(`password:${this.password || ''}:${this.passwordConfirm || ''}`)
  }

  @action
  public changePassword(password: string) {
    this.password = password
    this.validate()
  }

  @action
  public changePasswordConfirm(passwordConfirm: string) {
    this.passwordConfirm = passwordConfirm
    this.validate()
  }

  public fits(data: any) {
    return typeof data === 'string'
  }

  @action
  public fill(data: any) {
    this.value = data
  }

  public async asJS() {
    if (!this.valid) return null
    if (!this.password) return this.value
    return await generateHash(this.password, this.costFactor)
  }

  @computed
  public get valid() {
    return this.password === this.passwordConfirm
  }

  @action
  public validate() {
    return true
  }

  public clone(opts?: FieldStoreOptions) {
    return new PasswordFieldStore(Object.assign({}, this, opts))
  }
}
