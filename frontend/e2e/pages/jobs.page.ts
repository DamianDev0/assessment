import { type Page, type Locator, expect } from '@playwright/test'


export class JobsPage {
  readonly page: Page
  readonly table: Locator
  readonly createButton: Locator
  readonly statusFilter: Locator
  readonly searchInput: Locator
  readonly skeleton: Locator

  constructor(page: Page) {
    this.page = page
    this.table = page.getByTestId('jobs-table')
    this.createButton = page.getByTestId('create-job-button')
    this.statusFilter = page.getByTestId('status-filter')
    this.searchInput = page.getByTestId('search-filter')
    this.skeleton = page.getByTestId('jobs-skeleton')
  }

  async navigate() {
    await this.page.goto('/jobs')
  
    await expect(this.table.or(this.skeleton)).toBeVisible({ timeout: 10_000 })
   
    await expect(this.table).toBeVisible({ timeout: 10_000 })
  }

  async openCreateModal() {
    await this.createButton.click()
    await expect(this.page.getByTestId('create-job-modal')).toBeVisible()
  }

  async fillJobForm(data: {
    title: string
    description?: string
    street: string
    city: string
  }) {
    await this.page.getByTestId('job-title-input').fill(data.title)
    if (data.description) {
      await this.page.getByTestId('job-description-input').fill(data.description)
    }
    await this.page.getByTestId('job-street-input').fill(data.street)
    await this.page.getByTestId('job-city-input').fill(data.city)
  }

  async submitCreateForm() {
    await this.page.getByTestId('create-job-submit').click()
   
    await expect(this.page.getByTestId('create-job-modal')).toBeHidden({ timeout: 5_000 })
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status)
    await this.page.waitForLoadState('networkidle')
  }

  async searchJobs(term: string) {
    await this.searchInput.fill(term)
    // Debounce — wait for results to update
    await this.page.waitForTimeout(500)
  }

  async completeJob(jobId: string, signatureUrl: string) {
    await this.page.getByTestId(`complete-job-${jobId}`).click()
    await expect(this.page.getByTestId('complete-job-modal')).toBeVisible()
    await this.page.getByTestId('signature-url-input').fill(signatureUrl)
    await this.page.getByTestId('complete-job-submit').click()
    await expect(this.page.getByTestId('complete-job-modal')).toBeHidden({ timeout: 5_000 })
  }

  async getJobRow(title: string) {
    return this.table.getByText(title).locator('../..')
  }

  async getJobStatus(title: string): Promise<string> {
    const row = await this.getJobRow(title)
    return row.getByTestId('job-status').innerText()
  }
}
