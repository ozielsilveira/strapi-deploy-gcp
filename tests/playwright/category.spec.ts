import { expect, test } from "@playwright/test";

test("Criação de nova Categoria", async ({ page }) => {
    await page.goto("http://localhost:1337/admin");

    await page.fill('input[name="email"]', "admin@satc.edu.br");
    await page.fill('input[name="password"]', "welcomeToStrapi123");
    await page.click('button[type="submit"]');

    // Espera o painel carregar
    await page.waitForSelector("text=Content Manager");

    // Espera o botão "Categoria" aparecer e clica
    await page.waitForSelector("text=Categoria");
    await page.click("text=Categoria");

    // Cria nova entrada
    await page.waitForSelector("text=Create new entry");
    await page.click("text=Create new entry");

    // Preenche o campo de nome
    await page.fill(
        'input[placeholder="e.g. Tecnologia"]',
        "Categoria Teste Playwright"
    );

    // Salva
    await page.click("text=Save");

    // Verifica mensagem de sucesso
    await expect(page.locator("text=Entry created")).toBeVisible();
});