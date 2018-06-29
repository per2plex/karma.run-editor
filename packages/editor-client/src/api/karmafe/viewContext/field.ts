import {Model, Struct, KeyPath} from '../../karma/model'
import {Expression, expression as e} from '@karma.run/sdk'

export interface CommonFieldOptions {
  readonly label: string
  readonly description: string
}

export interface Field<V = any, O extends CommonFieldOptions = CommonFieldOptions> {
  readonly type: string
  readonly listComponent: React.ComponentType<V>
  readonly editComponent: React.ComponentType<V>

  // inferFromModel(model: Model, inferFn: (model: Model) => Field): T | undefined
  // optionsModel(): Model
  // unserialize(): T

  transformRawValue(value: any): V
  transformValueToExpression(value: V): Expression
}

export const TestComponent = (value: any) => value

export const StringField: Field<string> = {
  type: 'string',

  listComponent: TestComponent,
  editComponent: TestComponent,

  transformRawValue(value: any) {
    return value
  },

  transformValueToExpression(value: string) {
    return e.string(value)
  }
}

export const StructField: Field<{[key: string]: any}> = {
  type: 'struct',

  listComponent: TestComponent,
  editComponent: TestComponent,

  transformRawValue(value: any) {
    return value
  },

  transformValueToExpression(value: any) {
    return e.string(value)
  }
}

// export const StringField: FieldClass<string> = class StringField {
//   public readonly label: string = ''
//   public readonly description: string = ''
//   public readonly defaultValue: string = ''

//   public constructor() {}

//   public renderForList(value: string) {
//     return value
//   }

//   public renderForEdit(value: string) {
//     return value
//   }

//   public static type: string = 'string'
//   public static inferFromModel(_model: Model): Field | undefined {
//     return undefined
//   }

//   public static optionsModel(): Model {
//     return Struct()
//   }

//   public static unserialize(): StringField {
//     return new StringField()
//   }

//   public static transformRawValue(): string {
//     return ''
//   }

//   public static transformValueToExpression(value: string): Expression {
//     return e.string(value)
//   }
// }

export interface StructFieldOptions {}

// export class StructField {
//   public static inferFromModel(model: Model): Field | undefined {
//     if (model.type !== 'struct') return undefined
//     return new StructField()
//   }
// }

export class FieldRegistry {
  private fieldMap: ReadonlyMap<string, FieldClass>

  public constructor(...fieldClasses: FieldClass[]) {
    this.fieldMap = new Map(fieldClasses.map(field => [field.type, field] as [string, FieldClass]))
  }

  public get(type: string): FieldClass | undefined {
    return this.fieldMap.get(type)
  }
}

export const defaultFieldRegistry = new FieldRegistry(StringField)
