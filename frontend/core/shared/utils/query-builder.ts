type WhereOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'

interface WhereClause {
  field: string
  op: WhereOperator
  value: unknown
}

const OPERATOR_MAP: Record<WhereOperator, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
}

export class QueryBuilder<T, Selected extends keyof T = keyof T> {
  private readonly selectedFields: string[] = []
  private readonly whereClauses: WhereClause[] = []
  private orderByField: string | null = null
  private orderByDirection: 'asc' | 'desc' = 'asc'
  private limitValue: number | null = null

  select<K extends keyof T>(...fields: K[]): QueryBuilder<T, K> {
    const next = new QueryBuilder<T, K>()
    next.selectedFields.push(...fields.map(String))
    next.whereClauses.push(...this.whereClauses)
    next.orderByField = this.orderByField
    next.orderByDirection = this.orderByDirection
    next.limitValue = this.limitValue
    return next
  }

  where<K extends Selected>(
    field: K,
    op: WhereOperator,
    value: T[K]
  ): QueryBuilder<T, Selected> {
    const next = this.clone()
    next.whereClauses.push({ field: String(field), op, value })
    return next
  }

  orderBy(field: Selected, direction: 'asc' | 'desc'): QueryBuilder<T, Selected> {
    const next = this.clone()
    next.orderByField = String(field)
    next.orderByDirection = direction
    return next
  }

  limit(n: number): QueryBuilder<T, Selected> {
    const next = this.clone()
    next.limitValue = n
    return next
  }

  build(): { query: string; params: unknown[] } {
    const params: unknown[] = []
    const fields = this.selectedFields.length > 0
      ? this.selectedFields.join(', ')
      : '*'

    let query = `SELECT ${fields} FROM table`

    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses.map((clause, i) => {
        params.push(clause.value)
        return `${clause.field} ${OPERATOR_MAP[clause.op]} $${i + 1}`
      })
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    if (this.orderByField) {
      query += ` ORDER BY ${this.orderByField} ${this.orderByDirection.toUpperCase()}`
    }

    if (this.limitValue !== null) {
      query += ` LIMIT ${this.limitValue}`
    }

    return { query, params }
  }

  private clone(): QueryBuilder<T, Selected> {
    const next = new QueryBuilder<T, Selected>()
    next.selectedFields.push(...this.selectedFields)
    next.whereClauses.push(...this.whereClauses)
    next.orderByField = this.orderByField
    next.orderByDirection = this.orderByDirection
    next.limitValue = this.limitValue
    return next
  }
}
