import { test, expect } from '@playwright/test';

test('Sign-up and login flow', async ({ page }) => {
    const timestamp = Date.now();
    const testName = `test_user_${timestamp}`;
    const testEmail = `test_user_${timestamp}@example.com`;
    const testPassword = 'StrongP@ss1';

    // ---- Sign Up ----
    await test.step('Sign-up with validation checks and success', async () => {
        await page.goto('/authentication/register');

        await expect(page.getByRole('heading', { name: 'Nourished' })).toBeVisible();
        await expect(page.getByText('Wellness Made Simple')).toBeVisible();

        await expect(page.getByLabel('Name')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();

        await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
        await expect(page.getByText('Already have an account?')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign Up With Google' })).toBeVisible();

        // Submit empty form
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Name is required.')).toBeVisible();

        // Only Name
        await page.getByLabel('Name').fill(testName);
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Invalid email format.')).toBeVisible();

        // Invalid Email
        await page.getByLabel('Email Address').fill('john');
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Invalid email format.')).toBeVisible();

        // Valid Email
        await page.getByLabel('Email Address').fill(testEmail);

        // Weak Password
        await page.getByLabel('Password').fill('123456');
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Password must be at least 8 characters, contain a number and a special character.')).toBeVisible();

        // Valid Password
        await page.getByLabel('Password').fill(testPassword);
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

        await expect(page.getByText('Registration successful! Redirecting...')).toBeVisible();

        await page.waitForURL('**/dashboard');
        await expect(page.url()).toContain('/dashboard');

        await page.waitForTimeout(1500);

        await page.getByRole('button', { name: 'show profile menu' }).click();
        await page.getByRole('menuitem', { name: 'Logout' }).click();
    });

    // ---- Log In ----
    await test.step('Login form validation and successful login', async () => {
        // Time to load the page
        await page.waitForTimeout(3000);

        // Check if the login form is visible
        await expect(page.getByText('Wellness Made Simple')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In With Google' })).toBeVisible();

        // Try submitting empty form
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();

        // Invalid email format
        await page.getByLabel('Email Address').fill('invalid-email');
        await page.getByLabel('Password').fill('anything');
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();

        // Valid email, wrong password
        await page.getByLabel('Email Address').fill(testEmail);
        await page.getByLabel('Password').fill('WrongPassword123!');
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();
        await expect(page).not.toHaveURL(/.*dashboard/);

        // Valid credentials
        await page.getByLabel('Password').fill(testPassword);
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();

        await page.waitForURL('**/dashboard');
        await expect(page.url()).toContain('/dashboard');
    });
});
