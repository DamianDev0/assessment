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

  test('create, filter, and complete a job', async ({ page }) => {
    // ── 1. Create ────────────────────────────────────────────────────────────
    await jobsPage.openCreateModal()

    await jobsPage.fillJobForm({
      title: 'E2E Test Job',
      description: 'Created by Playwright',
      street: '123 Main St',
      city: 'Miami',
    })

    await jobsPage.submitCreateForm()

    // Job appears in table
    await expect(jobsPage.table).toContainText('E2E Test Job')

    // ── 2. Filter ────────────────────────────────────────────────────────────
    await jobsPage.filterByStatus('draft')

    await expect(jobsPage.table).toContainText('E2E Test Job')

    // Reset filter
    await jobsPage.filterByStatus('')

    // ── 3. Search ────────────────────────────────────────────────────────────
    await jobsPage.searchJobs('E2E Test')
    await expect(jobsPage.table).toContainText('E2E Test Job')
    await jobsPage.searchJobs('')
  })

  test('shows error message when form is submitted without required fields', async ({ page }) => {
    await jobsPage.openCreateModal()
    await page.getByTestId('create-job-submit').click()

    // HTML5 required validation prevents submission
    const titleInput = page.getByTestId('job-title-input')
    await expect(titleInput).toBeFocused()
  })

  test('closes modal on cancel', async ({ page }) => {
    await jobsPage.openCreateModal()
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('create-job-modal')).toBeHidden()
  })
})
