export interface AddressSuggestion {
  readonly formatted: string
  readonly addressLine1: string
  readonly addressLine2: string
  readonly city: string
  readonly stateCode: string
  readonly postcode: string
  readonly lat: number
  readonly lon: number
}
