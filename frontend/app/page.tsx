import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'JobTracker',
  description: 'Multi-tenant job management system for roofing companies',
}

export default function Home() {
  redirect('/jobs')
}
