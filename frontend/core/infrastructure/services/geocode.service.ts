import axios from 'axios'
import type { AddressSuggestion, GeoapifyResult, GeoapifyAutocompleteResponse } from '@/core/domain/entities/address'

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? ''
const BASE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'

function toSuggestion(r: GeoapifyResult): AddressSuggestion {
  return {
    formatted: r.formatted,
    addressLine1: r.address_line1 ?? '',
    addressLine2: r.address_line2 ?? '',
    city: r.city ?? '',
    stateCode: r.state_code ?? '',
    postcode: r.postcode ?? '',
    lat: r.lat,
    lon: r.lon,
  }
}

export const geocodeService = {
  async autocomplete(text: string): Promise<AddressSuggestion[]> {
    if (text.length < 3 || !API_KEY) return []

    const { data } = await axios.get<GeoapifyAutocompleteResponse>(BASE_URL, {
      params: { text, filter: 'countrycode:us', format: 'json', apiKey: API_KEY },
    })

    return (data.results ?? []).slice(0, 5).map(toSuggestion)
  },
}
