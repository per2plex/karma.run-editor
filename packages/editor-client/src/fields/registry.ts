import {FieldClass} from './interface'
import {StringField} from './string'
import {StructField} from './struct'
import {RefField} from './ref'
import {PasswordField} from './password'

export type FieldRegistry = ReadonlyMap<string, FieldClass>

export function createFieldRegistry(...fieldClasses: FieldClass[]): FieldRegistry {
  return new Map(fieldClasses.map(field => [field.type, field] as [string, FieldClass]))
}

export function mergeFieldRegistries(...registries: FieldRegistry[]): FieldRegistry {
  const values = registries.reduce(
    (acc, registry) => {
      return acc.concat(Array.from(registry.values()))
    },
    [] as FieldClass[]
  )

  return createFieldRegistry(...values)
}

export const defaultFieldRegistry = createFieldRegistry(
  PasswordField,
  StringField,
  StructField,
  RefField
)
