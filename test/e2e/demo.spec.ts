import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('')
})

test('landing page explains the framework and exposes all four demos', async ({ page }) => {
  await expect(page).toHaveTitle(/Vue Hierarchy Visualization Framework/)
  await expect(page.getByRole('heading', { name: /Vue Hierarchy Visualization Framework/ })).toBeVisible()
  for (const heading of ['Organization Chart Example', 'Permission Tree Example', 'Genealogy Example', 'Large Dataset Example']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
  await expect(page.getByText('Live Demo', { exact: true })).toBeVisible()
})

test('organization demo searches and supports drag editing', async ({ page }) => {
  const card = page.locator('#organization-example')
  await card.getByPlaceholder('Search nodes…').fill('Platform')
  await expect(card.getByText('1 match', { exact: true })).toBeVisible()
  await expect(card.locator('[data-node-id="platform"]')).toHaveClass(/is-match/)

  await card.locator('[data-node-id="design"]').dragTo(card.locator('[data-node-id="engineering"]'))
  await expect(card.locator('[data-node-id="design"]')).toBeVisible()
})

test('permission demo synchronizes checks and protects the disabled subgraph', async ({ page }) => {
  const card = page.locator('#permission-example')
  await card.getByLabel('Check Workspace').check()
  await expect(card.getByLabel('Check Export')).toBeChecked()
  await expect(card.getByLabel('Check Billing')).toBeDisabled()
  await expect(card.getByLabel('Check Invoices')).not.toBeChecked()
})

test('genealogy shows dual-parent, spouse, adoption, and cross relationships', async ({ page }) => {
  const card = page.locator('#genealogy-example')
  await expect(card.locator('.vh-edge--spouse')).toHaveCount(3)
  await expect(card.locator('.vh-edge--adoptive')).toHaveCount(2)
  await expect(card.locator('.vh-edge--cross')).toHaveCount(1)
  await expect(card.getByText('mentor', { exact: true })).toBeVisible()
})

test('large dataset loads only the requested branch', async ({ page }) => {
  const card = page.locator('#large-dataset-example')
  await expect(card.getByText('1 loaded')).toBeVisible()
  await card.getByRole('button', { name: 'Expand Global catalog' }).click()
  await expect(card.getByText('9 loaded')).toBeVisible()
  await expect(card.locator('[role="treeitem"]')).toHaveCount(9)
})
