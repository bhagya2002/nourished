import { test, expect } from '@playwright/test';

test('Create, Edit, and Delete Goals', async ({ page }) => {
    const testEmail = 'playwright@email.com';
    const testPassword = 'playwright@1234';

    const randomId = Math.floor(Math.random() * 99999) + 1;
    const goalTitle = `Create Goal${randomId}`;
    const editGoalTitle = `Edit Goal${randomId}`;


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
        await page.getByRole('link', { name: 'Goals (Challenges)' }).click();
        await page.waitForURL('**/goals');
        await expect(page.url()).toContain('/goals');

        await expect(page.locator('div').filter({ hasText: /^Create Goal$/ }).getByRole('button')).toBeVisible();
        await page.locator('div').filter({ hasText: /^Create Goal$/ }).getByRole('button').click();

        await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Deadline' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill(goalTitle);
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

        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
        await page.getByRole('button', { name: 'Create' }).click();


        await expect(page.getByRole('heading', { name: goalTitle })).toBeVisible();
        await expect(page.getByText('Create Description').first()).toBeVisible();

        await expect(page.getByRole('button', { name: 'Show Tasks' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Task' }).first()).toBeVisible();
        await expect(page.getByRole('button').filter({ hasText: /^$/ }).nth(2).first()).toBeVisible();
    });

    // ---- Edit Goals ----
    await test.step('Edit Goals', async () => {
        await expect(page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first()).toBeVisible();
        await page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first().click();
        await page.getByText('Edit').first().click();

        // Input Random Task Details
        await page.getByRole('textbox', { name: 'Title' }).fill(editGoalTitle);
        await page.getByRole('textbox', { name: 'Description' }).fill('Edit Description');

        await expect(page.getByRole('button', { name: 'Update' })).toBeVisible();
        await page.getByRole('button', { name: 'Update' }).click();

        await expect(page.getByRole('heading', { name: editGoalTitle })).toBeVisible();
        await expect(page.getByText('Edit Description').first()).toBeVisible();
    });

    // ---- Delete Goals ----
    await test.step('Delete Goals', async () => {
        await page.waitForTimeout(2000);

        const deleteButton = page.getByRole('button').filter({ hasText: /^$/ }).nth(2);

        while (await deleteButton.count() > 0) {
            await deleteButton.first().click();
            await page.getByText('Delete').click();

            page.once('dialog', async dialog => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept();
            });
        }

        await expect(page.getByRole('heading', { name: 'Set Your Goals' })).toBeVisible();
        await expect(page.getByText('Create goals to track your progress')).toBeVisible();
    });
});
