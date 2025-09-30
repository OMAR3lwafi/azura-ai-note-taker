import { test, expect } from '@playwright/test';

test.describe('Gallery View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to gallery
    await page.goto('http://localhost:5173/gallery');
  });

  test('should display list of meetings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my meetings/i })).toBeVisible();
    
    // Check for meeting cards
    const meetingCards = page.locator('[data-testid="meeting-card"]');
    await expect(meetingCards.first()).toBeVisible();
  });

  test('should search meetings', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('project');

    // Wait for search results
    await page.waitForTimeout(500);

    const results = page.locator('[data-testid="meeting-card"]');
    await expect(results.first()).toBeVisible();
  });

  test('should filter by date', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /filter/i });
    await filterButton.click();

    // Select date filter
    await page.click('text="Last 7 days"');

    // Verify filter applied
    await expect(page.getByText(/last 7 days/i)).toBeVisible();
  });

  test('should sort meetings', async ({ page }) => {
    const sortButton = page.getByRole('button', { name: /sort/i });
    await sortButton.click();

    // Select sort option
    await page.click('text="Date (newest first)"');

    // Verify sort applied
    await expect(page.getByText(/date \(newest first\)/i)).toBeVisible();
  });

  test('should open meeting details', async ({ page }) => {
    const firstMeeting = page.locator('[data-testid="meeting-card"]').first();
    await firstMeeting.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/meeting\/[a-z0-9-]+/);
  });

  test('should toggle view mode (grid/list)', async ({ page }) => {
    const viewToggle = page.getByTestId('view-toggle');
    await viewToggle.click();

    // Should switch to grid view
    await expect(page.getByTestId('grid-view')).toBeVisible();

    // Toggle back
    await viewToggle.click();
    await expect(page.getByTestId('list-view')).toBeVisible();
  });
});

test.describe('Meeting Details', () => {
  test('should display meeting information', async ({ page }) => {
    await page.goto('http://localhost:5173/meeting/test-id');

    await expect(page.getByTestId('meeting-title')).toBeVisible();
    await expect(page.getByTestId('meeting-summary')).toBeVisible();
    await expect(page.getByTestId('meeting-transcript')).toBeVisible();
  });

  test('should edit meeting title', async ({ page }) => {
    await page.goto('http://localhost:5173/meeting/test-id');

    const editButton = page.getByRole('button', { name: /edit title/i });
    await editButton.click();

    const titleInput = page.getByTestId('title-input');
    await titleInput.fill('Updated Meeting Title');
    await titleInput.press('Enter');

    await expect(page.getByText('Updated Meeting Title')).toBeVisible();
  });

  test('should add tags', async ({ page }) => {
    await page.goto('http://localhost:5173/meeting/test-id');

    const addTagButton = page.getByRole('button', { name: /add tag/i });
    await addTagButton.click();

    const tagInput = page.getByPlaceholder(/enter tag/i);
    await tagInput.fill('important');
    await tagInput.press('Enter');

    await expect(page.getByText('important')).toBeVisible();
  });

  test('should delete meeting with confirmation', async ({ page }) => {
    await page.goto('http://localhost:5173/meeting/test-id');

    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm deletion
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Should redirect to gallery
    await expect(page).toHaveURL(/\/gallery/);
  });

  test('should download transcript', async ({ page }) => {
    await page.goto('http://localhost:5173/meeting/test-id');

    const downloadButton = page.getByRole('button', { name: /download/i });
    
    // Setup download handler
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    await page.click('text="PDF"');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Gallery Actions', () => {
  test('should select multiple meetings', async ({ page }) => {
    await page.goto('http://localhost:5173/gallery');

    // Enable selection mode
    const selectButton = page.getByRole('button', { name: /select/i });
    await selectButton.click();

    // Select meetings
    const checkboxes = page.locator('[data-testid="meeting-checkbox"]');
    await checkboxes.first().check();
    await checkboxes.nth(1).check();

    // Verify selection count
    await expect(page.getByText(/2 selected/i)).toBeVisible();
  });

  test('should bulk delete meetings', async ({ page }) => {
    await page.goto('http://localhost:5173/gallery');

    // Select meetings
    await page.click('button:has-text("Select")');
    await page.check('[data-testid="meeting-checkbox"]');

    // Delete
    await page.click('button:has-text("Delete Selected")');
    await page.click('button:has-text("Confirm")');

    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });
});
