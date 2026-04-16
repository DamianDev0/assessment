import axios, { AxiosError } from 'axios'
import { ApiError } from '@/core/shared/interfaces/api-response'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050'
const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? '00000000-0000-0000-0000-000000000001'

export const DEFAULT_CUSTOMER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID ?? '00000000-0000-0000-0000-000000000002'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'X-Organization-Id': ORG_ID,
  },
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ code?: string; message?: string; title?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status ?? 500
    const data = error.response?.data
    const message = data?.message ?? data?.title ?? error.message
    const code = data?.code

    return Promise.reject(new ApiError(message, status, code))
  }
)
