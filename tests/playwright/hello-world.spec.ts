import { expect, test } from '@playwright/test';

test('verifica se a aplicação está funcionando corretamente', async ({ page }) => {
    await page.goto('http://localhost:1337/admin');
    const title = await page.title();
    expect(title).toBe('Strapi Admin');
});