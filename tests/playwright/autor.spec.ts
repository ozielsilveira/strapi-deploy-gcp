import { test } from "@playwright/test";

test("Deve criar um novo autor no Strapi e realizar logout", async ({
  page,
}) => {
  // Acessa a tela de login do painel administrativo
  await page.goto("http://localhost:1337/admin/auth/login");

  // Preenche o e-mail do administrador
  await page.getByRole("textbox", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("admin@satc.edu.br");

  // Preenche a senha
  await page.getByRole("textbox", { name: "Password" }).click();
  await page
    .getByRole("textbox", { name: "Password" })
    .fill("welcomeToStrapi123");

  // Marca a opção "Remember me"
  await page.getByRole("checkbox", { name: "Remember me" }).click();

  // Realiza login
  await page.getByRole("button", { name: "Login" }).click();

  // Acessa o gerenciador de conteúdo
  await page.getByRole("link", { name: "Content Manager" }).click();

  // Abre a seção de "Autor"
  await page.getByRole("link", { name: "Autor" }).click();

  // Clica para criar um novo autor
  await page
    .locator("div")
    .filter({ hasText: /^AutorCreate new entry$/ })
    .getByRole("link")
    .click();

  // Preenche o nome do novo autor
  await page.getByRole("textbox", { name: "Nome" }).click();
  await page.getByRole("textbox", { name: "Nome" }).fill("Teste de Autor");

  // Salva o novo autor
  await page.getByRole("button", { name: "Save" }).click();

  // Acessa o menu do usuário logado
  await page.getByRole("button", { name: "SA Super Admin" }).click();

  // Faz logout da sessão
  await page.getByText("Log out").click();
});
