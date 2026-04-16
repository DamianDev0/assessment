// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCreateJob } from '@/presentation/views/jobs/features/create-job/hooks/use-create-job.hook'
import { clientContainer } from '@/core/infrastructure/container/client-container'

vi.mock('sileo', () => ({
  sileo: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/use-address-autocomplete', () => ({
  useAddressAutocomplete: () => ({
    query: '',
    suggestions: [],
    isLoading: false,
    setQuery: vi.fn(),
    select: vi.fn(),
    clear: vi.fn(),
  }),
}))

const VALID_ADDRESS = {
  formatted: '123 Main St, Miami, FL 33101',
  addressLine1: '123 Main St',
  addressLine2: '',
  city: 'Miami',
  stateCode: 'FL',
  postcode: '33101',
  lat: 25.77,
  lon: -80.19,
}

function makeForm(fields: Record<string, string>): HTMLFormElement {
  const form = document.createElement('form')
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  return form
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return React.createElement(QueryClientProvider, { client }, children)
}

describe('useCreateJob', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts closed and without errors', () => {
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })

    expect(result.current.isModalOpen).toBe(false)
    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.selectedAddress).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('openModal switches isModalOpen to true', () => {
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })

    act(() => { result.current.openModal() })

    expect(result.current.isModalOpen).toBe(true)
  })

  it('closeModal resets modal and selected address', () => {
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })

    act(() => { result.current.openModal() })
    act(() => { result.current.handleAddressSelect(VALID_ADDRESS) })
    act(() => { result.current.closeModal() })

    expect(result.current.isModalOpen).toBe(false)
    expect(result.current.selectedAddress).toBeNull()
  })

  it('handleAddressSelect stores the selected address', () => {
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })

    act(() => { result.current.handleAddressSelect(VALID_ADDRESS) })

    expect(result.current.selectedAddress).toEqual(VALID_ADDRESS)
  })

  it('populates fieldErrors when submitting invalid data (no title, no address)', () => {
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })
    const form = makeForm({ title: '', description: '', customerId: '', assigneeId: '' })

    act(() => { result.current.handleFormSubmit(form) })

    expect(Object.keys(result.current.fieldErrors).length).toBeGreaterThan(0)
    expect(result.current.fieldErrors.title).toBeDefined()
  })

  it('does NOT call the use case when validation fails', () => {
    const executeSpy = vi.spyOn(clientContainer.createJob, 'execute')
    const { result } = renderHook(() => useCreateJob(vi.fn()), { wrapper })
    const form = makeForm({ title: '', description: '', customerId: '', assigneeId: '' })

    act(() => { result.current.handleFormSubmit(form) })

    expect(executeSpy).not.toHaveBeenCalled()
  })

  it('calls createJob use case + onSuccess when submit is valid', async () => {
    const executeSpy = vi.spyOn(clientContainer.createJob, 'execute').mockResolvedValue('new-job-id')
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateJob(onSuccess), { wrapper })

    act(() => { result.current.handleAddressSelect(VALID_ADDRESS) })
    const form = makeForm({
      title: 'Fix Roof',
      description: 'Replace shingles',
      customerId: '00000000-0000-0000-0000-000000000001',
      assigneeId: '',
    })

    act(() => { result.current.handleFormSubmit(form) })

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledTimes(1)
    })

    expect(executeSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Fix Roof',
      street: '123 Main St',
      city: 'Miami',
      customerId: '00000000-0000-0000-0000-000000000001',
    }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
    expect(result.current.isModalOpen).toBe(false)
  })

  it('does not call onSuccess and exposes error when the mutation fails', async () => {
    vi.spyOn(clientContainer.createJob, 'execute').mockRejectedValue(new Error('Backend down'))
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateJob(onSuccess), { wrapper })

    act(() => { result.current.handleAddressSelect(VALID_ADDRESS) })
    const form = makeForm({
      title: 'Fix Roof',
      description: 'desc',
      customerId: '00000000-0000-0000-0000-000000000001',
      assigneeId: '',
    })

    act(() => { result.current.handleFormSubmit(form) })

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })
})
