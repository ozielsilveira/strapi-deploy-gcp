import { test } from "@playwright/test";

test("Deve criar e publicar um novo artigo no Strapi e realizar logout", async ({
  page,
}) => {
  // Acessa a tela de login do painel administrativo
  await page.goto("http://localhost:1337/admin/auth/login");

  // Preenche o campo de e-mail do administrador
  await page.getByRole("textbox", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("admin@satc.edu.br");

  // Preenche o campo de senha
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

  // Navega para a seção de artigos
  await page.getByRole("link", { name: "Artigo" }).click();

  // Inicia a criação de um novo artigo
  await page.getByRole("link", { name: "Create new entry" }).click();

  // Preenche o título do novo artigo
  await page.getByRole("textbox", { name: "Titulo" }).click();
  await page.getByRole("textbox", { name: "Titulo" }).fill("Teste de artigo");

  // Publica o artigo
  await page.getByRole("button", { name: "Publish" }).click();

  // Abre o menu do usuário logado
  await page.getByRole("button", { name: "SA Super Admin" }).click();

  // Realiza logout
  await page.getByText("Log out").click();

  // Verifica se voltou para a tela de boas-vindas
  await page.getByRole("heading", { name: "Welcome to Strapi!" }).click(); // opcional
});
