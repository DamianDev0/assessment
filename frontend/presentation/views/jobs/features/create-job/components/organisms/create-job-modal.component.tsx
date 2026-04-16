'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { FormField } from '@/components/molecules/form-field'
import { AddressAutocomplete } from '@/components/molecules/address-autocomplete'
import type { AddressSuggestion } from '@/core/domain/entities/address'

interface AddressAutocompleteState {
  readonly query: string
  readonly suggestions: readonly AddressSuggestion[]
  readonly isOpen: boolean
  readonly search: (text: string) => void
  readonly close: () => void
}

interface CreateJobModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onFormSubmit: (form: HTMLFormElement) => void
  readonly isLoading: boolean
  readonly fieldErrors: Readonly<Record<string, string>>
  readonly address: AddressAutocompleteState
  readonly selectedAddress: AddressSuggestion | null
  readonly onAddressSelect: (suggestion: AddressSuggestion) => void
  readonly defaultCustomerId?: string
}

export function CreateJobModal({
  isOpen,
  onClose,
  onFormSubmit,
  isLoading,
  fieldErrors,
  address,
  selectedAddress,
  onAddressSelect,
  defaultCustomerId,
}: Readonly<CreateJobModalProps>) {
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    onFormSubmit(e.currentTarget)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent data-testid="create-job-modal" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Fill in the details for the new roofing job.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="title" label="Title" error={fieldErrors.title} className="sm:col-span-2" data-testid="job-title-input" />
            <FormField id="description" label="Description" error={fieldErrors.description} className="sm:col-span-2" data-testid="job-description-input" />
          </fieldset>

          <fieldset className="space-y-3">
            <label htmlFor="address-input" className="block text-sm font-[510] text-foreground">Address</label>
            <AddressAutocomplete
              query={address.query}
              suggestions={address.suggestions}
              isOpen={address.isOpen}
              onSearch={address.search}
              onSelect={onAddressSelect}
              onClose={address.close}
              placeholder="Search address..."
            />
            {fieldErrors.street ? (
              <p className="text-xs text-destructive">{fieldErrors.street}</p>
            ) : null}

            {selectedAddress ? (
              <div className="grid grid-cols-2 gap-3">
                <FormField id="street" label="Street" readOnly value={selectedAddress.addressLine1} data-testid="job-street-input" />
                <FormField id="city" label="City" readOnly value={selectedAddress.city} data-testid="job-city-input" />
                <FormField id="state" label="State" readOnly value={selectedAddress.stateCode} />
                <FormField id="zipCode" label="Zip Code" readOnly value={selectedAddress.postcode} />
              </div>
            ) : null}
          </fieldset>

          <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="customerId" label="Customer ID" error={fieldErrors.customerId} value={defaultCustomerId} />
            <FormField id="assigneeId" label="Assignee ID" error={fieldErrors.assigneeId} />
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} data-testid="cancel-button">Cancel</Button>
            <Button type="submit" disabled={isLoading} data-testid="create-job-submit">
              {isLoading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
