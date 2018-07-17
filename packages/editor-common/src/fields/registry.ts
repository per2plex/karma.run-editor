import {FieldClass} from './interface'
import {StringField} from './string'
import {StructField} from './struct'
import {RefField} from './ref'
import {PasswordField} from './password'
import {RecursionField, RecurseField, RecursiveField} from './recursion'
import {OptionalField} from './optional'
import {UnionField} from './union'
import {TupleField} from './tuple'
import {MapField} from './map'
import {ListField} from './list'
import {BoolField} from './bool'
import {NumberField} from './number'
import {EnumField} from './enum'
import {SetField} from './set'
import {DateTimeField} from './dateTime'
import {NullField} from './null'
import {CurrentUserField} from './currentUser'
import {ErrorField} from './error'

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
  ErrorField,
  CurrentUserField,
  PasswordField,
  BoolField,
  StringField,
  NumberField,
  StructField,
  UnionField,
  TupleField,
  MapField,
  ListField,
  SetField,
  RefField,
  RecursionField,
  RecursiveField,
  RecurseField,
  OptionalField,
  EnumField,
  DateTimeField,
  NullField
)
