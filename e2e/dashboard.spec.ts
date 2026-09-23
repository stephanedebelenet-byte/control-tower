import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@mojazine.ma')
    await page.fill('input[type="password"]', 'demo123456')
    await page.click('button:has-text("Login")')
    await page.waitForURL('/dashboard')
  })

  test('should display dashboard', async ({ page }) => {
    await expect(page.locator('text=Mojazine')).toBeVisible()
    await expect(page.locator('text=Fleet Management')).toBeVisible()
  })

  test('should display map', async ({ page }) => {
    const mapContainer = page.locator('#map')
    await expect(mapContainer).toBeVisible()
  })

  test('should display fleet metrics', async ({ page }) => {
    await expect(page.locator('text=Active')).toBeVisible()
    await expect(page.locator('text=Capacity')).toBeVisible()
    await expect(page.locator('text=Utilization')).toBeVisible()
  })

  test('should allow vehicle selection', async ({ page }) => {
    // Click first vehicle in list
    const firstVehicle = page.locator('div').filter({ hasText: 'TMS-' }).first()
    await firstVehicle.click()

    // Verify detail panel appears
    await expect(page.locator('text=Location')).toBeVisible()
  })
})
