import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'admin@mojazine.ma')
    await page.fill('input[type="password"]', 'demo123456')

    await page.click('button:has-text("Login")')

    await expect(page).toHaveURL('/dashboard')
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpass')

    await page.click('button:has-text("Login")')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'admin@mojazine.ma')
    await page.fill('input[type="password"]', 'demo123456')
    await page.click('button:has-text("Login")')

    await expect(page).toHaveURL('/dashboard')

    await page.click('button:has-text("Logout")')

    await expect(page).toHaveURL('/login')
  })
})
