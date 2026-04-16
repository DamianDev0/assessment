import { test, expect } from '@playwright/test'
import { JobsPage } from './pages/jobs.page'

test.describe('Jobs page', () => {
  let jobsPage: JobsPage

  test.beforeEach(async ({ page }) => {
    jobsPage = new JobsPage(page)
    await jobsPage.navigate()
  })

  test('renders jobs table on load', async () => {
    await expect(jobsPage.table).toBeVisible()
  })

  test('opens create modal and closes with cancel', async ({ page }) => {
    await jobsPage.openCreateModal()
    await jobsPage.cancelCreateModal()
    await expect(page.getByTestId('create-job-modal')).toBeHidden()
  })

  test('validates required fields on submit without data', async ({ page }) => {
    await jobsPage.openCreateModal()
    await jobsPage.clickSubmit()
    // Our Zod validator reports at least the title as required.
    // Modal stays open so the error can be displayed.
    await expect(page.getByTestId('create-job-modal')).toBeVisible()
  })

  test('filters table by status via Radix Select', async ({ page }) => {
    await jobsPage.filterByStatus('Completed')
    await expect(jobsPage.statusFilter).toContainText('Completed')

    await jobsPage.filterByStatus('All statuses')
    await expect(jobsPage.table).toBeVisible()
    // Spot-check that a row is rendered (depends on seed/prod data).
    const rowCount = await page.getByRole('row').count()
    expect(rowCount).toBeGreaterThan(1) // 1 header + N body rows
  })

  test('search filters the table', async () => {
    await jobsPage.searchJobs('zzzz-no-match')
    await expect(jobsPage.table).toContainText(/No jobs found|No results/i)
    await jobsPage.searchJobs('')
  })
})
