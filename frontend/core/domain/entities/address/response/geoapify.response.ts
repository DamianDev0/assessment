export interface GeoapifyResult {
  readonly formatted: string
  readonly address_line1?: string
  readonly address_line2?: string
  readonly city?: string
  readonly state_code?: string
  readonly postcode?: string
  readonly lat: number
  readonly lon: number
}

export interface GeoapifyAutocompleteResponse {
  readonly results: GeoapifyResult[]
}
