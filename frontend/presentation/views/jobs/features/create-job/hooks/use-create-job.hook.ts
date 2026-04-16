'use client'

import { useReducer, useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { clientContainer } from '@/core/infrastructure/di/client-container'
import { createJobSchema } from '@/core/application/schemas/create-job.schema'
import { useAddressAutocomplete } from '@/components/hooks/use-address-autocomplete'
import { extractFormValues } from '@/core/shared/utils/form'
import { CREATE_JOB_TEXT_KEYS } from '../config/form-keys.config'
import type { CreateJobFormData } from '@/core/application/dto/create-job.dto'
import type { AddressSuggestion } from '@/core/domain/entities/address'

interface State {
  isModalOpen: boolean
  fieldErrors: Record<string, string>
}

type Action =
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_FIELD_ERRORS'; fieldErrors: Record<string, string> }
  | { type: 'CLEAR_ERRORS' }

const initialState: State = { isModalOpen: false, fieldErrors: {} }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { isModalOpen: true, fieldErrors: {} }
    case 'CLOSE_MODAL':
      return initialState
    case 'SET_FIELD_ERRORS':
      return { ...state, fieldErrors: action.fieldErrors }
    case 'CLEAR_ERRORS':
      return { ...state, fieldErrors: {} }
  }
}

function validate(data: CreateJobFormData): Record<string, string> | null {
  const result = createJobSchema.safeParse(data)
  if (result.success) return null

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? 'general'
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}

export function useCreateJob(onSuccess: () => void) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const address = useAddressAutocomplete()
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)

  const mutation = useMutation({
    mutationFn: (data: CreateJobFormData) => clientContainer.createJob.execute(data),
    onSuccess: () => {
      dispatch({ type: 'CLOSE_MODAL' })
      setSelectedAddress(null)
      sileo.success({ title: 'Job created', description: 'The new job has been added.' })
      onSuccess()
    },
    onError: (error: Error) => {
      sileo.error({ title: 'Failed to create job', description: error.message })
    },
  })

  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion)
    address.select(suggestion)
  }, [address])

  const handleFormSubmit = useCallback((form: HTMLFormElement) => {
    const v = extractFormValues(form, CREATE_JOB_TEXT_KEYS)

    const data: CreateJobFormData = {
      title: v.title,
      description: v.description,
      street: selectedAddress?.addressLine1 ?? '',
      city: selectedAddress?.city ?? '',
      state: selectedAddress?.stateCode ?? '',
      zipCode: selectedAddress?.postcode ?? '',
      latitude: selectedAddress?.lat ?? 0,
      longitude: selectedAddress?.lon ?? 0,
      customerId: v.customerId,
      assigneeId: v.assigneeId || undefined,
    }

    const fieldErrors = validate(data)
    if (fieldErrors) {
      dispatch({ type: 'SET_FIELD_ERRORS', fieldErrors })
      return
    }

    dispatch({ type: 'CLEAR_ERRORS' })
    mutation.mutate(data)
  }, [selectedAddress, mutation])

  const openModal = useCallback(() => dispatch({ type: 'OPEN_MODAL' }), [])
  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' })
    setSelectedAddress(null)
  }, [])

  return {
    isModalOpen: state.isModalOpen,
    isLoading: mutation.isPending,
    fieldErrors: state.fieldErrors,
    address,
    selectedAddress,
    openModal,
    closeModal,
    handleAddressSelect,
    handleFormSubmit,
  }
}
