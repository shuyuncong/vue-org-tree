import type { HierarchyErrorCode, JSONValue } from './types'

export class HierarchyError extends Error {
  readonly code: HierarchyErrorCode
  readonly details?: JSONValue

  constructor(code: HierarchyErrorCode, message: string, details?: JSONValue) {
    super(message)
    this.name = 'HierarchyError'
    this.code = code
    this.details = details
  }
}

export function asHierarchyError(error: unknown, fallback: HierarchyErrorCode = 'INVALID_DOCUMENT') {
  if (error instanceof HierarchyError) return error
  return new HierarchyError(fallback, error instanceof Error ? error.message : String(error))
}
