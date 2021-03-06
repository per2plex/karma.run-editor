export const enum ConditionType {
  // List
  ListLengthEqual = 'listLengthEqual',
  ListLengthMin = 'listLengthMin',
  ListLengthMax = 'listLengthMax',

  // Map
  // MapHasKey = 'mapHasKey',

  // Optional
  OptionalIsPresent = 'optionalIsPresent',

  // Union
  UnionKeyEqual = 'unionKeyEqual',

  // Enum
  EnumEqual = 'enumEqual',

  // String
  StringEqual = 'stringEqual',
  StringStartsWith = 'stringStartsWith',
  StringEndsWith = 'stringEndsWith',
  StringIncludes = 'stringIncludes',
  StringRegExp = 'stringRegExp',

  // Number
  NumberEqual = 'numberEqual',
  NumberMin = 'numberMin',
  NumberMax = 'numberMax',

  // Date
  DateEqual = 'dateEqual',
  DateMin = 'dateMin',
  DateMax = 'dateMax',

  // Ref
  RefEqual = 'refEqual'
}

export const enum TypeCompatibility {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean'
}

export const enum ValuePathSegmentType {
  List = 'list',
  Map = 'map',
  Optional = 'optional',
  Struct = 'struct',
  Union = 'union'
}

export const TypeCompatibilityMap = {
  // String
  [ConditionType.StringEqual]: TypeCompatibility.String,
  [ConditionType.StringStartsWith]: TypeCompatibility.String,
  [ConditionType.StringEndsWith]: TypeCompatibility.String,
  [ConditionType.StringIncludes]: TypeCompatibility.String,
  [ConditionType.StringRegExp]: TypeCompatibility.String,

  // Number
  [ConditionType.NumberEqual]: TypeCompatibility.Number,
  [ConditionType.NumberMin]: TypeCompatibility.Number,
  [ConditionType.NumberMax]: TypeCompatibility.Number,
  [ConditionType.ListLengthEqual]: TypeCompatibility.Number,
  [ConditionType.ListLengthMin]: TypeCompatibility.Number,
  [ConditionType.ListLengthMax]: TypeCompatibility.Number,

  // Date
  [ConditionType.DateEqual]: TypeCompatibility.Date,
  [ConditionType.DateMin]: TypeCompatibility.Date,
  [ConditionType.DateMax]: TypeCompatibility.Date,

  // Bool
  [ConditionType.OptionalIsPresent]: TypeCompatibility.Boolean,

  // Incompatible
  [ConditionType.RefEqual]: undefined,
  [ConditionType.EnumEqual]: undefined,
  [ConditionType.UnionKeyEqual]: undefined
}

export interface ListPathSegment {
  type: ValuePathSegmentType.List
}
export function ListPathSegment(): ListPathSegment {
  return {type: ValuePathSegmentType.List}
}

export interface MapPathSegment {
  type: ValuePathSegmentType.Map
}
export function MapPathSegment(): MapPathSegment {
  return {type: ValuePathSegmentType.Map}
}

export interface StructPathSegment {
  type: ValuePathSegmentType.Struct
  key: string
}
export function StructPathSegment(key: string): StructPathSegment {
  return {type: ValuePathSegmentType.Struct, key}
}

export interface UnionPathSegment {
  type: ValuePathSegmentType.Union
  key: string
}
export function UnionPathSegment(key: string): UnionPathSegment {
  return {type: ValuePathSegmentType.Union, key}
}

export interface OptionalPathSegment {
  type: ValuePathSegmentType.Optional
}
export function OptionalPathSegment(): OptionalPathSegment {
  return {type: ValuePathSegmentType.Optional}
}

export type ValuePathSegment =
  | ListPathSegment
  | MapPathSegment
  | StructPathSegment
  | UnionPathSegment
  | OptionalPathSegment

export type ValuePath = ValuePathSegment[]

export function getValuesForValuePath(value: any, path: ValuePath, index: number = 0): any[] {
  if (value == undefined || path.length === 0 || index >= path.length) return [value]

  const pathSegment = path[index]

  switch (pathSegment.type) {
    case ValuePathSegmentType.List: {
      if (!Array.isArray(value)) return []
      return value.reduce(
        (values: any[], value) => [
          ...values,
          ...(getValuesForValuePath(value, path, index + 1) || [])
        ],
        []
      )
    }

    case ValuePathSegmentType.Map: {
      if (typeof value !== 'object') return []
      return Object.values(value).reduce(
        (values: any[], value) => [
          ...values,
          ...(getValuesForValuePath(value, path, index + 1) || [])
        ],
        []
      )
    }

    case ValuePathSegmentType.Union:
    case ValuePathSegmentType.Struct:
      return getValuesForValuePath(value[pathSegment.key], path, index + 1)

    case ValuePathSegmentType.Optional:
      return [value]
  }

  return []
}

export function isTypeValueCompatible(typeA: ConditionType, typeB: ConditionType) {
  if (!TypeCompatibilityMap[typeA] || !TypeCompatibilityMap[typeB]) return
  return TypeCompatibilityMap[typeA] === TypeCompatibilityMap[typeB]
}

export interface BaseCondition {
  type: ConditionType
  path: ValuePathSegment[]
}

export interface StringCondition extends BaseCondition {
  type:
    | ConditionType.StringEqual
    | ConditionType.StringStartsWith
    | ConditionType.StringEndsWith
    | ConditionType.StringIncludes
    | ConditionType.StringRegExp
  value: string
}

export interface OptionalStringCondition extends BaseCondition {
  type: ConditionType.RefEqual | ConditionType.UnionKeyEqual | ConditionType.EnumEqual
  value: string | undefined
}

export interface NumberCondition extends BaseCondition {
  type:
    | ConditionType.ListLengthEqual
    | ConditionType.ListLengthMin
    | ConditionType.ListLengthMax
    | ConditionType.NumberEqual
    | ConditionType.NumberMin
    | ConditionType.NumberMax
  value: number
}

export interface BooleanCondition extends BaseCondition {
  type: ConditionType.OptionalIsPresent
  value: boolean
}

export interface DateCondition extends BaseCondition {
  type: ConditionType.DateEqual | ConditionType.DateMin | ConditionType.DateMax
  value: Date
}

export type Condition =
  | StringCondition
  | DateCondition
  | NumberCondition
  | OptionalStringCondition
  | BooleanCondition

export const enum FilterType {
  FullText = 'fullText',
  Composite = 'composite',
  Condition = 'condition'
}

export interface FullTextFilter {
  type: FilterType.FullText
  value: string
}
export function FullTextFilter(value: string): FullTextFilter {
  return {type: FilterType.FullText, value}
}

export interface CompositeFilter {
  type: FilterType.Composite
  filters: Filter[]
}
export function CompositeFilter(filters: Filter[]): CompositeFilter {
  return {type: FilterType.Composite, filters}
}

export interface ValueFilter {
  type: FilterType.Condition
  condition: Condition
}
export function ValueFilter(condition: Condition): ValueFilter {
  return {type: FilterType.Condition, condition}
}

export type Filter = CompositeFilter | FullTextFilter | ValueFilter

export const enum SortType {
  Date = 'date',
  String = 'string'
}

export interface Sort {
  path: ValuePath
  type: SortType
  descending: boolean
}
