import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges tailwind classes properly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('handles conditional classes properly', () => {
    const isActive = true
    const isError = false
    
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isError && 'error-class'
    )
    
    expect(result).toBe('base-class active-class')
  })

  it('resolves tailwind conflicts using tailwind-merge', () => {
    // px-2 and px-4 conflict, tailwind-merge should pick the last one
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })
})
