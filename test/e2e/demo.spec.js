import { expect, test } from '@playwright/test'

test('production demo loads its assets and renders the organization tree', async ({ page }) => {
  const failedResponses = []
  const pageErrors = []
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(response.url())
  })
  page.on('pageerror', error => pageErrors.push(error.message))

  await page.goto('')
  await page.waitForTimeout(1000)

  await expect(page).toHaveTitle(/Vue Org Tree Demo/)
  expect({ failedResponses, pageErrors, body: await page.locator('body').innerHTML() }).toEqual({
    failedResponses: [],
    pageErrors: [],
    body: expect.stringContaining('org-tree-container')
  })
  await expect(page.locator('.org-tree-container')).toBeVisible()
  await expect(page.getByText('截图')).toBeVisible()
  await expect(page.locator('.org-tree-node-label-inner').first()).toBeVisible()
  expect(failedResponses).toEqual([])
})

test('collapse control changes the visible tree', async ({ page }) => {
  await page.goto('')
  const nodesBefore = await page.locator('.org-tree-node').count()

  await page.locator('.org-tree-node-btn').first().click()

  await expect.poll(() => page.locator('.org-tree-node').count()).not.toBe(nodesBefore)
})

test('screenshot control downloads a PNG', async ({ page }) => {
  await page.goto('')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTitle('截图').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('orgchart.png')
})
