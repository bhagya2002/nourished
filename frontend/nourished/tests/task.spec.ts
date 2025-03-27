import { test, expect } from '@playwright/test';

test('Create, Edit, and Delete Task', async ({ page }) => {
    const testEmail = 'testuser@email.com';
    const testPassword = 'testuser@1234';

    // ---- Log In ----
    await test.step('Login', async () => {
        await page.goto('/');

        // Time to load the page
        await page.waitForTimeout(3000);

        // Check if the login form is visible
        await expect(page.getByText('Wellness Made Simple')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In With Google' })).toBeVisible();

        await page.getByLabel('Email Address').fill(testEmail);
        await page.getByLabel('Password').fill(testPassword);
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await page.waitForURL('**/dashboard');
        await expect(page.url()).toContain('/dashboard');
    });

    // ---- Create Task ----
    await test.step('Create Task', async () => {
        // Time to load the page
        await page.waitForTimeout(3000);

        await page.getByRole('link', { name: 'Tasks' }).click();
        await page.waitForURL('**/tasks');
        await expect(page.url()).toContain('/tasks');

        await expect(page.locator('div').filter({ hasText: /^Create Task$/ }).getByRole('button')).toBeVisible();
        await page.locator('div').filter({ hasText: /^Create Task$/ }).getByRole('button').click();

        await page.waitForTimeout(1000);

        await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
        await expect(page.getByRole('combobox', { name: 'Frequency' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill('Create Task');
        await page.getByRole('textbox', { name: 'Description' }).fill('Create Description');
        await page.getByRole('combobox', { name: 'Frequency' }).click();
        await page.getByRole('option', { name: 'Daily' }).click();

        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Create' }).click();

        await page.waitForTimeout(2000);

        await expect(page.getByText('DailyCreate TaskCreate')).toBeVisible();
        await expect(page.getByText('Daily', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Create Task' })).toBeVisible();
        await expect(page.getByText('Create Description')).toBeVisible();
        await expect(page.getByRole('button').filter({ hasText: /^$/ }).nth(2)).toBeVisible();
    });

    // ---- Edit Task ----
    await test.step('Edit Task', async () => {
        // Time to load the page
        await page.waitForTimeout(2000);

        await page.locator('div:nth-child(6) > .MuiButtonBase-root').first().click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill('Edit Task');
        await page.getByRole('textbox', { name: 'Description' }).fill('Edit Description');
        await page.getByRole('combobox', { name: 'Frequency' }).click();
        await page.getByRole('option', { name: 'Monthly' }).click();

        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Save' }).click();

        await page.waitForTimeout(2000);

        await expect(page.getByText('MonthlyEdit TaskEdit')).toBeVisible();
        await expect(page.getByText('Monthly', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
    });

    // ---- Delete Task ----
    await test.step('Delete Task', async () => {
        await page.waitForTimeout(2000);

        await page.locator('div:nth-child(6) > .MuiButtonBase-root').first().click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();

        await page.waitForTimeout(1000);

        // No Tasks
        await expect(page.getByRole('heading', { name: 'You don\'t have any active' })).toBeVisible();
        await expect(page.getByText('Create your first task to get')).toBeVisible();

        await page.waitForTimeout(1000);
    });
});
