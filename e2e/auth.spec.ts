import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login screen', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should login with email OTP', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Send Code")');

    // Wait for OTP input
    await expect(page.getByText(/enter the code/i)).toBeVisible();

    // Enter OTP (in real test, you'd need to get this from email)
    await page.fill('input[name="otp"]', '123456');
    await page.click('button:has-text("Verify")');

    // Should redirect to home
    await expect(page).toHaveURL(/\/home/);
  });

  test('should logout successfully', async ({ page }) => {
    // Assume user is logged in
    await page.goto('http://localhost:5173/home');

    // Open user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('http://localhost:5173/session');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
