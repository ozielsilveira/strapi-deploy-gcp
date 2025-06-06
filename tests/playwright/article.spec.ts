import { expect, test } from "@playwright/test";

test("Criação de novo Artigo", async ({ page }) => {
    await page.goto("http://localhost:1337/admin");

    await page.fill('input[name="email"]', "admin@satc.edu.br");
    await page.fill('input[name="password"]', "welcomeToStrapi123");
    await page.click('button[type="submit"]');

    await page.waitForSelector("text=Content Manager");

    // Vai para a collection Article
    await page.click("text=Article");

    // Cria novo artigo
    await page.click("text=Create new entry");

    // Preenche os campos
    await page.fill(
        'input[placeholder="e.g. My amazing blog post"]',
        "Artigo Playwright"
    );
    await page.fill(
        'textarea[placeholder="e.g. Once upon a time..."]',
        "Esse é um artigo de teste automatizado"
    );

    // Salva
    await page.click("text=Save");

    await expect(page.locator("text=Entry created")).toBeVisible();
});