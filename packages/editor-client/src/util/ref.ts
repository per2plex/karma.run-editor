import {Ref} from '@karma.run/sdk'

export type RefString = string

export function refToString(ref: Ref): RefString {
  return ref.join('/') as RefString
}

export function stringToRef(refString: RefString): Ref {
  const ref = refString.split('/')
  if (ref.length < 2) throw new Error('Invalid RefString!')
  return ref as Ref
}

export class RefMap<V> extends Map<RefString, V> {
  public constructor(iterable: Iterable<[Ref | RefString, V]>) {
    const mappedEntries: [RefString, V][] = []

    for (const tuple of iterable) {
      const ref = tuple[0]
      const stringRef = typeof ref !== 'string' ? refToString(ref) : ref
      const value = tuple[1]

      mappedEntries.push([stringRef, value])
    }

    super(mappedEntries)
  }

  public get(ref: Ref | RefString) {
    if (typeof ref === 'string') return super.get(ref)
    return super.get(refToString(ref))
  }

  public has(ref: Ref | RefString) {
    if (typeof ref === 'string') return super.has(ref)
    return super.has(refToString(ref))
  }

  public delete(ref: Ref | RefString) {
    if (typeof ref === 'string') return super.delete(ref)
    return super.delete(refToString(ref))
  }

  public set(ref: Ref | RefString, value: V) {
    if (typeof ref === 'string') return super.set(ref, value)
    return super.set(refToString(ref), value)
  }
}

export interface ReadonlyRefMap<V> extends ReadonlyMap<RefString, V> {
  get(ref: RefString | Ref): V | undefined
  has(ref: RefString | Ref): boolean
}
