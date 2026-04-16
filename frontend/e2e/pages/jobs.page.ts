import { type Page, type Locator, expect } from '@playwright/test'

export class JobsPage {
  readonly page: Page
  readonly table: Locator
  readonly createButton: Locator
  readonly statusFilter: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.table = page.getByTestId('jobs-table')
    this.createButton = page.getByTestId('create-job-button')
    this.statusFilter = page.getByTestId('status-filter')
    this.searchInput = page.getByTestId('search-filter')
  }

  async navigate() {
    await this.page.goto('/jobs')
    // Server renders jobs-table in initial HTML since data comes from the
    // Server Component. Wait for it (hydration may add a transient skeleton
    // next to it during streaming, so we cannot rely on the skeleton being
    // unique).
    await expect(this.table).toBeVisible({ timeout: 15_000 })
  }

  async openCreateModal() {
    await this.createButton.click()
    await expect(this.page.getByTestId('create-job-modal')).toBeVisible()
  }

  async fillTitle(title: string) {
    await this.page.getByTestId('job-title-input').fill(title)
  }

  async clickSubmit() {
    await this.page.getByTestId('create-job-submit').click()
  }

  async cancelCreateModal() {
    await this.page.getByTestId('cancel-button').click()
    await expect(this.page.getByTestId('create-job-modal')).toBeHidden()
  }

  // Radix Select requires click trigger + click item (not native selectOption).
  async filterByStatus(label: 'All statuses' | 'Draft' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled') {
    await this.statusFilter.click()
    await this.page.getByRole('option', { name: label, exact: true }).click()
    await expect(this.statusFilter).toContainText(label === 'All statuses' ? /./ : label)
  }

  async searchJobs(term: string) {
    await this.searchInput.fill(term)
    await this.page.waitForTimeout(300)
  }

  async getJobStatus(title: string): Promise<string> {
    const row = this.table.getByRole('row').filter({ hasText: title })
    return row.getByTestId('job-status').innerText()
  }
}
