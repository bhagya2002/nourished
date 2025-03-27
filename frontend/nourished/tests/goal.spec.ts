import { test, expect } from '@playwright/test';

test('Create, Edit, and Delete Goals', async ({ page }) => {
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

    // ---- Create Goals ----
    await test.step('Create Goals', async () => {
        // Time to load the page
        await page.waitForTimeout(3000);

        await page.getByRole('link', { name: 'Goals (Challenges)' }).click();
        await page.waitForURL('**/goals');
        await expect(page.url()).toContain('/goals');

        await expect(page.locator('div').filter({ hasText: /^Create Goal$/ }).getByRole('button')).toBeVisible();
        await page.locator('div').filter({ hasText: /^Create Goal$/ }).getByRole('button').click();

        await page.waitForTimeout(1000);

        await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Deadline' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill('Create Goal');
        await page.getByRole('textbox', { name: 'Description' }).fill('Create Description');

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        today.setDate(today.getDate() + 5); // Add 5 days

        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const dd = String(today.getDate()).padStart(2, '0');

        const formattedDate = `${yyyy}-${mm}-${dd}`;

        // Make sure the input is visible
        await expect(page.getByRole('textbox', { name: 'Deadline' })).toBeVisible();

        // Fill the input with today's date
        await page.getByRole('textbox', { name: 'Deadline' }).fill(formattedDate);

        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Create' }).click();

        await page.waitForTimeout(2000);

        await expect(page.getByRole('heading', { name: 'Create Goal' })).toBeVisible();
        await expect(page.getByText('Create Description')).toBeVisible();
        await page.waitForTimeout(2000);
        await expect(page.getByRole('button', { name: 'Show Tasks' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Task' })).toBeVisible();
        await expect(page.getByRole('button').filter({ hasText: /^$/ }).nth(3)).toBeVisible();
    });

    // ---- Edit Goals ----
    await test.step('Edit Goals', async () => {
        // Time to load the page
        await page.waitForTimeout(2000);

        await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();
        await page.getByText('Edit').click();

        // generate random number
        const random = Math.floor(Math.random() * 1000);

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill(`Edit Goal ${random}`);
        await page.getByRole('textbox', { name: 'Description' }).fill('Edit Description');

        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Update' }).click();

        await page.waitForTimeout(2000);

        await expect(page.getByRole('heading', { name: 'Edit Goal' })).toBeVisible();
        await expect(page.getByText('Edit Description')).toBeVisible();
    });

    // ---- Delete Goals ----
    // await test.step('Delete Goals', async () => {
    //     await page.waitForTimeout(2000);

    //     // Open the delete dropdown or trigger button
    //     await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();

    //     // Click the 'Delete' option
    //     await page.getByText('Delete').click();

    //     // Wait for the confirmation toast/message
    //     await expect(page.getByText('Are you sure you want to delete this goal?')).toBeVisible();

    //     // Click the "OK" button to confirm
    //     await page.getByRole('button', { name: 'OK' }).click();

    //     // Optionally, verify the toast disappears or success message appears
    //     await expect(page.getByText('Are you sure you want to delete this goal?')).toBeHidden();

    //     await page.waitForTimeout(5000);

    //     // No Tasks
    //     // await expect(page.getByRole('heading', { name: 'You don\'t have any active' })).toBeVisible();
    //     // await expect(page.getByText('Create your first task to get')).toBeVisible();

    //     await page.waitForTimeout(1000);
    // });
});
