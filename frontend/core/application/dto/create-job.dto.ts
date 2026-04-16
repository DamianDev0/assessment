export interface CreateJobFormData {
  title: string
  description: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  customerId: string
  assigneeId?: string
}
