export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isValidation(): boolean {
    return this.status === 400
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}
