import { test, expect } from '@playwright/test';

test('Validate Mood Tracker, Friend Circle, and Profile Page.', async ({ page }) => {
    const testEmail = 'playwright@email.com';
    const testPassword = 'playwright@1234';

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

    await test.step('Mood Tracker', async () => {
        await page.getByRole('link', { name: 'Mood Tracker' }).click();
        await page.waitForURL('**/mood');
        await expect(page.url()).toContain('/mood');

        await expect(
            page.getByRole('heading', { name: 'Mood Tracker' }).locator('span')
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Track your daily moods to' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'How are you feeling today?' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Mood Calendar' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Mood Insights' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Mood Distribution' })
        ).toBeVisible();
    });

    await test.step('Friend Circle', async () => {
        await page.getByRole('link', { name: 'Friend Circle' }).click();
        await page.waitForURL('**/friend-circle');
        await expect(page.url()).toContain('/friend-circle');

        await page.getByRole('link', { name: 'Friend Circle' }).first().click();
        await expect(
            page.getByRole('heading', { name: 'Share your journey and' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Recent Goals' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Create Post' })
        ).toBeVisible();
    });

    await test.step('Profile Page', async () => {
        await page.getByRole('link', { name: 'Profile' }).click();
        await page.waitForURL('**/profile');
        await expect(page.url()).toContain('/profile');

        await expect(
            page.getByRole('heading', { name: 'Playwright' })
        ).toBeVisible();
        await expect(
            page.getByText('playwright@email.com')
        ).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Overview' })
        ).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Activity' })
        ).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Friends' })
        ).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Connections' })
        ).toBeVisible();
    });
});
