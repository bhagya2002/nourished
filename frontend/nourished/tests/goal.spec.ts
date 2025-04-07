import { test, expect } from '@playwright/test';

test('Create, Edit, and Delete Goals', async ({ page }) => {
    const testEmail = 'playwright@email.com';
    const testPassword = 'playwright@1234';

    const randomId = Math.floor(Math.random() * 99999) + 1;
    const goalTitle = `Create Goal${randomId}`;
    const editGoalTitle = `Edit Goal${randomId}`;


    await test.step('Login', async () => {
        await page.goto('/');

        await page.waitForTimeout(3000);


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


        await page.getByRole('textbox', { name: 'Title' }).fill(goalTitle);
        await page.getByRole('textbox', { name: 'Description' }).fill('Create Description');


        const today = new Date();
        today.setDate(today.getDate() + 5);

        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        const formattedDate = `${yyyy}-${mm}-${dd}`;

        await expect(page.getByRole('textbox', { name: 'Deadline' })).toBeVisible();

        await page.getByRole('textbox', { name: 'Deadline' }).fill(formattedDate);

        await page.waitForTimeout(1000);

        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
        await page.getByRole('button', { name: 'Create' }).click();

        await expect(page.getByRole('heading', { name: goalTitle })).toBeVisible();
        await expect(page.getByText('Create Description').first()).toBeVisible();

        await expect(page.getByRole('button', { name: 'Show Tasks' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Add Task' }).first()).toBeVisible();
        await expect(page.getByRole('button').filter({ hasText: /^$/ }).nth(2).first()).toBeVisible();
    });


    await test.step('Edit Goals', async () => {
        await expect(page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first()).toBeVisible();
        await page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first().click();
        await page.getByText('Edit', { exact: true }).first().click();

        await page.getByRole('textbox', { name: 'Title' }).fill(editGoalTitle);
        await page.getByRole('textbox', { name: 'Description' }).fill('Edit Description');

        await expect(page.getByRole('button', { name: 'Update' })).toBeVisible();
        await page.getByRole('button', { name: 'Update' }).click();

        await expect(page.getByRole('heading', { name: editGoalTitle })).toBeVisible();
        await expect(page.getByText('Edit Description').first()).toBeVisible();
    });


    await test.step('Delete Goals', async () => {
        await expect(page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first()).toBeVisible()
        await page.waitForTimeout(1000);
        await page.locator('.MuiCardContent-root > div:nth-child(2) > .MuiButtonBase-root').first().click();

        await expect(page.getByText('Delete')).toBeVisible();
        await page.getByText('Delete').click();

        await expect(page.getByRole('heading', { name: 'Delete Goal' })).toBeVisible();
        await expect(page.getByText('Are you sure you want to')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
        await page.getByRole('button', { name: 'Delete' }).click();
    });
});
