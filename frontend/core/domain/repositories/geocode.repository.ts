import type { AddressSuggestion } from '../entities/address'

export interface GeocodeRepository {
  autocomplete(text: string): Promise<AddressSuggestion[]>
}
