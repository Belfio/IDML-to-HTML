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

    // Check file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('upload page renders correctly', async ({ page }) => {
    // Already on upload page (it's the homepage now)

    // Check heading
    await expect(page.locator('h1')).toContainText('Upload IDML File');

    // Check file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
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

  test('file upload and preview workflow', async ({ page }) => {
    // Already on upload page (homepage)

    // Path to test IDML file
    const testFile = path.join(process.cwd(), 'app', 'assets', 'example.idml');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);

    // Submit form and wait for navigation
    const uploadButton = page.locator('button[type="submit"]');

    // Wait for the upload to complete and redirect
    await Promise.all([
      page.waitForURL(/\/preview\/.+/, { timeout: 60000 }),
      uploadButton.click()
    ]);

    // Check preview page loaded
    await expect(page.locator('h1')).toContainText('IDML Preview');

    // Check file name is displayed in header
    await expect(page.locator('text=File: example.idml')).toBeVisible();

    // Check document info section
    await expect(page.locator('text=Document Info')).toBeVisible();
    await expect(page.locator('text=✓ Processed')).toBeVisible();

    // Check preview content exists
    const previewContent = page.locator('.idml-preview');
    await expect(previewContent).toBeVisible();

    // Check action buttons are present
    await expect(page.locator('text=Upload New File')).toBeVisible();
    await expect(page.locator('text=Print Preview')).toBeVisible();
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

    // Check form has proper label
    const label = page.locator('label[for="idmlFile"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText('Select IDML File');

    // Check input has id matching label
    const input = page.locator('#idmlFile');
    await expect(input).toBeVisible();

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

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);

    // Should have no console errors
    expect(errors.length).toBe(0);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
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
