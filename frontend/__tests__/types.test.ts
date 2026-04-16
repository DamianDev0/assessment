import { describe, it, expectTypeOf } from 'vitest'
import type { DeepReadonly } from '@/core/shared/utils/deep-readonly'
import type { PathKeys } from '@/core/shared/utils/path-keys'

describe('DeepReadonly<T>', () => {
  it('makes primitive fields readonly', () => {
    type T = DeepReadonly<{ name: string; age: number }>
    expectTypeOf<T>().toEqualTypeOf<{ readonly name: string; readonly age: number }>()
  })

  it('recursively makes nested objects readonly', () => {
    type T = DeepReadonly<{ a: { b: { c: string } } }>
    expectTypeOf<T>().toEqualTypeOf<{ readonly a: { readonly b: { readonly c: string } } }>()
  })

  it('makes array items readonly', () => {
    type T = DeepReadonly<{ items: string[] }>
    expectTypeOf<T['items']>().toEqualTypeOf<ReadonlyArray<string>>()
  })

  it('handles Map', () => {
    type T = DeepReadonly<Map<string, { value: number }>>
    expectTypeOf<T>().toEqualTypeOf<ReadonlyMap<string, { readonly value: number }>>()
  })

  it('handles Set', () => {
    type T = DeepReadonly<Set<{ id: string }>>
    expectTypeOf<T>().toEqualTypeOf<ReadonlySet<{ readonly id: string }>>()
  })
})

describe('PathKeys<T>', () => {
  it('returns leaf paths for flat object', () => {
    type T = PathKeys<{ a: string; b: number }>
    expectTypeOf<T>().toEqualTypeOf<'a' | 'b'>()
  })

  it('returns dot-notation paths for nested objects', () => {
    type T = PathKeys<{ a: { b: string; c: { d: number } } }>
    expectTypeOf<T>().toEqualTypeOf<'a.b' | 'a.c.d'>()
  })
})
