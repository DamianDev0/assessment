import type { GeocodeRepository } from '@/core/domain/repositories/geocode.repository'
import type { AddressSuggestion } from '@/core/domain/entities/address'
import { geocodeService } from '../services/geocode.service'

export class GeocodeRepositoryImpl implements GeocodeRepository {
  autocomplete(text: string): Promise<AddressSuggestion[]> {
    return geocodeService.autocomplete(text)
  }
}

export const geocodeRepository = new GeocodeRepositoryImpl()
