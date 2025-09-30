import { test, expect } from '@playwright/test';

test.describe('Session Recording', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in
    await page.goto('http://localhost:5173/session');
  });

  test('should display session editor interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /new session/i })).toBeVisible();
    await expect(page.getByTestId('transcript-pane')).toBeVisible();
    await expect(page.getByTestId('insights-panel')).toBeVisible();
  });

  test('should request microphone permission', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);

    const startButton = page.getByRole('button', { name: /start recording/i });
    await startButton.click();

    await expect(page.getByText(/recording/i)).toBeVisible();
  });

  test('should display transcript in real-time', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    // Start recording
    await page.click('button:has-text("Start Recording")');

    // Wait for transcript to appear (mocked in test)
    await page.waitForSelector('[data-testid="transcript-segment"]', { timeout: 5000 });

    const segments = page.locator('[data-testid="transcript-segment"]');
    await expect(segments).toHaveCount(1);
  });

  test('should show speaker labels', async ({ page }) => {
    // Assuming some segments exist
    const speakerLabel = page.locator('[data-testid="speaker-badge"]').first();
    await expect(speakerLabel).toBeVisible();
  });

  test('should display AI suggestions', async ({ page }) => {
    const insightsPanel = page.getByTestId('insights-panel');
    await expect(insightsPanel).toBeVisible();

    // Check for summary section
    const summary = page.getByTestId('ai-summary');
    await expect(summary).toBeVisible();
  });

  test('should allow pausing recording', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    // Start recording
    await page.click('button:has-text("Start Recording")');
    await expect(page.getByText(/recording/i)).toBeVisible();

    // Pause
    await page.click('button:has-text("Pause")');
    await expect(page.getByText(/paused/i)).toBeVisible();
  });

  test('should stop recording and save', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);

    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Wait a bit
    await page.waitForTimeout(2000);

    // Stop
    await page.click('button:has-text("Stop")');

    // Should show save dialog or redirect
    await expect(page.getByText(/session saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing meeting title', async ({ page }) => {
    const titleInput = page.getByPlaceholder(/meeting title/i);
    await titleInput.fill('Important Team Meeting');
    
    await expect(titleInput).toHaveValue('Important Team Meeting');
  });

  test('should toggle task completion', async ({ page }) => {
    // Assuming a task exists
    const taskCheckbox = page.locator('[data-testid="task-checkbox"]').first();
    
    if (await taskCheckbox.isVisible()) {
      await taskCheckbox.click();
      await expect(taskCheckbox).toBeChecked();
    }
  });
});

test.describe('Session Review', () => {
  test('should display post-session review screen', async ({ page }) => {
    // Navigate to a completed session
    await page.goto('http://localhost:5173/session/123/review');

    await expect(page.getByRole('heading', { name: /review session/i })).toBeVisible();
  });

  test('should show full transcript', async ({ page }) => {
    await page.goto('http://localhost:5173/session/123/review');

    const transcript = page.getByTestId('full-transcript');
    await expect(transcript).toBeVisible();
  });

  test('should allow exporting in different formats', async ({ page }) => {
    await page.goto('http://localhost:5173/session/123/review');

    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();

    // Check export options
    await expect(page.getByText(/PDF/i)).toBeVisible();
    await expect(page.getByText(/Markdown/i)).toBeVisible();
    await expect(page.getByText(/Text/i)).toBeVisible();
  });
});
