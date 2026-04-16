export interface Job {
  id: string
  title: string
  description: string
  status: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  scheduledDate: string | null
  assigneeId: string | null
  customerId: string
  organizationId: string
  photoCount: number
  createdAt: string
  updatedAt: string
}

export interface JobFilters {
  status: string | null
  dateFrom: Date | null
  dateTo: Date | null
  assigneeId: string | null
  searchTerm: string | null
}
