import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  street: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  latitude: z.number(),
  longitude: z.number(),
  customerId: z.string().min(1, 'Customer is required'),
  assigneeId: z.string().optional().default(''),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
