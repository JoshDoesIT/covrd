import { test, expect } from '@playwright/test'

test.describe('covrd Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject localStorage state before page loads so Onboarding never mounts
    await page.addInitScript(() => {
      window.localStorage.setItem('covrd-onboarding-complete', 'true')
    })
    await page.goto('/')
  })

  test('Has visible command palette and app shell', async ({ page }) => {
    await expect(page.locator('.shell__brand-mark')).toHaveText('covrd')

    // Command Palette should open with Mod+K
    await page.keyboard.press('Meta+k')
    // Fallback if Meta+K doesn't instantly trigger in headless
    // We can also have an action but standard check is enough
    const cm = page.locator('[cmdk-root]')
    await expect(cm).toBeVisible()
  })

  test('Primary Scheduling Flow - Empty state prompts generation', async ({ page }) => {
    // Navigate to actual schedule manager via sidebar if not open
    const navLink = page.getByText(/Schedule/i).first()
    if (await navLink.isVisible()) {
      await navLink.click()
    }

    // Since DB is fresh (indexedDB), ScheduleManager will show empty state
    await expect(page.getByText('No Active Schedule')).toBeVisible()
    await expect(page.getByRole('button', { name: /Automagic Schedule/i }).first()).toBeVisible()
  })
})
