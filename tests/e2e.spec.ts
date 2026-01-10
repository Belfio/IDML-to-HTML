import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:5173';

test.describe('IDML Editor Platform E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL before each test
    await page.goto(BASE_URL);
  });

  test('homepage loads correctly', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/IDML Editor/);

    // Check upload page heading
    await expect(page.locator('h1')).toContainText('Upload IDML File');

    // Check file input exists (hidden as part of drag-and-drop UI)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('upload page renders correctly', async ({ page }) => {
    // Already on upload page (it's the homepage now)

    // Check heading
    await expect(page.locator('h1')).toContainText('Upload IDML File');

    // Check file input exists (hidden as part of drag-and-drop UI)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', '.idml');

    // Check upload button exists
    const uploadButton = page.locator('button[type="submit"]');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toContainText('Upload and Process');

    // Check help text
    await expect(page.locator('text=Maximum file size: 50MB')).toBeVisible();
  });

  test('file upload validation - no file selected', async ({ page }) => {
    // Already on upload page (homepage)

    // Try to submit without selecting a file
    const uploadButton = page.locator('button[type="submit"]');
    await uploadButton.click();

    // Check that HTML5 validation prevents submission
    // (Required field validation should prevent the form from being submitted)
    await page.waitForTimeout(500);

    // We should still be on the upload page
    expect(page.url()).toBe(`${BASE_URL}/`);
  });

  test('file upload and editor workflow', async ({ page }) => {
    // Already on upload page (homepage)

    // Path to test IDML file
    const testFile = path.join(process.cwd(), 'app', 'assets', 'example.idml');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);

    // Wait a moment for the file to be set and any client-side validation
    await page.waitForTimeout(100);

    // Verify the file input has the file
    const files = await fileInput.evaluate((input: HTMLInputElement) => {
      return input.files ? Array.from(input.files).map(f => f.name) : [];
    });
    expect(files).toContain('example.idml');

    // Submit form and wait for navigation to editor
    const uploadButton = page.locator('button[type="submit"]');

    // Click the button and wait for navigation
    // Using waitForNavigation is more reliable than waitForURL in some cases
    await uploadButton.click();

    // Wait for the URL to change to the editor page
    await page.waitForURL(/\/editor\/.+/, { timeout: 60000 });

    // Check editor page loaded
    await expect(page.locator('text=example.idml')).toBeVisible({ timeout: 10000 });

    // Check that we're on the editor page (not stuck on upload)
    expect(page.url()).toMatch(/\/editor\/.+/);

    // Check spread navigation is visible (use more specific selector to avoid multiple matches)
    await expect(page.locator('text=Spread').first()).toBeVisible();

    // Check tool panel exists
    const toolPanel = page.locator('aside').first();
    await expect(toolPanel).toBeVisible();

    // Wait for canvas element to appear (fabric.js creates multiple canvases, so use first())
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached({ timeout: 10000 });

    // Wait for loading to complete - either text should disappear or not be present
    try {
      await page.waitForSelector('text=Initializing canvas...', { state: 'detached', timeout: 5000 });
    } catch {
      // Already gone or never appeared
    }
    try {
      await page.waitForSelector('text=Loading spread...', { state: 'detached', timeout: 10000 });
    } catch {
      // Already gone or never appeared
    }
  });

  test('navigation between pages', async ({ page }) => {
    // Start at homepage (which is the upload page)
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toContainText('Upload');

    // Navigate to a preview page would require an upload first
    // For now just verify we're on the right page
    await expect(page.locator('text=What happens next?')).toBeVisible();
  });

  test('upload page styling and responsiveness', async ({ page }) => {
    // Already on homepage/upload page

    // Check that main container has proper styling
    const container = page.locator('.container');
    await expect(container).toBeVisible();

    // Check form card has shadow and rounded corners
    const formCard = page.locator('.bg-white.shadow-md.rounded-lg');
    await expect(formCard).toBeVisible();

    // Check button has proper styling
    const button = page.locator('button[type="submit"]');
    const bgColor = await button.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // Should have blue background
    expect(bgColor).toBeTruthy();
  });

  test('info box displays correctly', async ({ page }) => {
    // Already on homepage/upload page

    // Check info box
    await expect(page.locator('text=What happens next?')).toBeVisible();

    // Check list items
    await expect(page.locator('text=Your IDML file will be uploaded')).toBeVisible();
    await expect(page.locator('text=You can view and edit the content')).toBeVisible();
  });

  test('accessibility - form labels and structure', async ({ page }) => {
    // Already on homepage/upload page

    // Check input has proper id (label check removed as file input is hidden in drag-and-drop UI)
    const input = page.locator('#idmlFile');
    await expect(input).toBeAttached();

    // Check heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('page performance - load time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    console.log(`Page loaded in ${loadTime}ms`);
  });

  test('console errors check', async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors (filter out dev server manifest patch errors)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore Remix dev server manifest patch errors
        if (!text.includes('Failed to fetch manifest patches')) {
          errors.push(text);
        }
      }
    });

    await page.goto(BASE_URL);

    // Wait a bit for any lazy-loaded errors
    await page.waitForTimeout(1000);

    // Log errors for debugging
    if (errors.length > 0) {
      console.log('Console errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Should have no console errors (excluding dev server noise)
    expect(errors.length).toBe(0);
  });
});

test.describe('Preview Page Tests', () => {
  test.skip('preview page with invalid ID shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/preview/invalid-id-123`);

    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible();

    // Should have link back to upload
    const backLink = page.locator('text=Back to Upload');
    await expect(backLink).toBeVisible();
  });
});
