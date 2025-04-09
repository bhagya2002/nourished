import { test, expect } from '@playwright/test';

test('Sign-up and login flow', async ({ page }) => {
    const timestamp = Date.now();
    const testName = `test_user_${timestamp}`;
    const testEmail = `test_user_${timestamp}@example.com`;
    const testPassword = 'StrongP@ss1';


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


        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Name is required.')).toBeVisible();


        await page.getByLabel('Name').fill(testName);
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Invalid email format.')).toBeVisible();


        await page.getByLabel('Email Address').fill('john');
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Invalid email format.')).toBeVisible();


        await page.getByLabel('Email Address').fill(testEmail);


        await page.getByLabel('Password').fill('123456');
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
        await expect(page.getByText('Password must be at least 8 characters, contain a number and a special character.')).toBeVisible();


        await page.getByLabel('Password').fill(testPassword);
        await page.getByRole('button', { name: 'Sign Up', exact: true }).click();

        await expect(page.getByText('Registration successful! Redirecting...')).toBeVisible();

        await page.waitForURL('**/dashboard');
        await expect(page.url()).toContain('/dashboard');

        await expect(page.getByRole('heading', { name: 'Welcome back,' })).toBeVisible();
        await page.getByRole('button', { name: 'show profile menu' }).click();
        await page.getByRole('menuitem', { name: 'Logout' }).click();
    });


    await test.step('Login form validation and successful login', async () => {

        await page.waitForTimeout(3000);


        await expect(page.getByText('Wellness Made Simple')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In With Google' })).toBeVisible();


        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();


        await page.getByLabel('Email Address').fill('invalid-email');
        await page.getByLabel('Password').fill('anything');
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();


        await page.getByLabel('Email Address').fill(testEmail);
        await page.getByLabel('Password').fill('WrongPassword123!');
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();
        await expect(page).not.toHaveURL(/.*dashboard/);


        await page.getByLabel('Password').fill(testPassword);
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();

        await page.waitForURL('**/dashboard');
        await expect(page.url()).toContain('/dashboard');

        await page.waitForTimeout(1500);

        await expect(page.getByRole('heading', { name: 'Welcome back,' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your Wellness Plant' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Task Progress' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Get your daily wellness tip' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Your Streak' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Goal Progress' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Task Completion Trends' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Happiness Trends' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Wellness Categories' })).toBeVisible();


        await expect(page.getByRole('link', { name: 'Goals (Challenges)' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Mood Tracker' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Friend Circle' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    });
});
