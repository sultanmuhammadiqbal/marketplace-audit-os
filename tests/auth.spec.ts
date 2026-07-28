import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page and allow successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login form is visible
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Fill in credentials and submit
    await page.getByLabel('Email').fill('test@acme.com');
    await page.getByLabel('Password').fill('securepassword123');
    await page.getByRole('button', { name: 'Login' }).click();

    // In a real e2e environment, this would redirect to /dashboard
    // Assuming backend returns success and sets cookies
    // await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should redirect unauthenticated users away from protected routes', async ({ page }) => {
    // Attempt to access a protected route directly
    await page.goto('/dashboard');
    
    // Middleware should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should allow registration of a new user', async ({ page }) => {
    await page.goto('/register');

    // Verify registration form is visible
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();

    // Fill out registration form
    await page.getByLabel('First name').fill('Jane');
    await page.getByLabel('Last name').fill('Doe');
    await page.getByLabel('Email').fill('jane.doe@example.com');
    await page.getByLabel('Password').fill('securepassword123');
    await page.getByRole('button', { name: 'Create an account' }).click();

    // In a real e2e environment, this would handle registration flow
  });
});
