import { test } from "@playwright/test";

test("Deve criar uma nova categoria no Strapi e fazer logout", async ({
  page,
}) => {
  // Acessa a página de login do painel administrativo
  await page.goto("http://localhost:1337/admin/auth/login");

  // Preenche o campo de e-mail
  await page.getByRole("textbox", { name: "Email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("admin@satc.edu.br");

  // Preenche o campo de senha
  await page.getByRole("textbox", { name: "Password" }).click();
  await page
    .getByRole("textbox", { name: "Password" })
    .fill("welcomeToStrapi123");

  // Marca a opção "Lembrar de mim"
  await page.getByRole("checkbox", { name: "Remember me" }).click();

  // Clica no botão de login
  await page.getByRole("button", { name: "Login" }).click();

  // Acessa o módulo de gerenciamento de conteúdo
  await page.getByRole("link", { name: "Content Manager" }).click();

  // Acessa a lista de categorias
  await page.getByRole("link", { name: "Categoria" }).click();

  // Inicia a criação de uma nova categoria
  await page.getByRole("link", { name: "Create new entry" }).click();

  // Preenche o nome da nova categoria
  await page
    .getByRole("textbox", { name: "Nome" })
    .click({ modifiers: ["Shift"] });
  await page.getByRole("textbox", { name: "Nome" }).click(); // redundante, mas deixado como capturado
  await page.getByRole("textbox", { name: "Nome" }).fill("Teste de Categoria");

  // Salva a nova categoria
  await page.getByRole("button", { name: "Save" }).click();

  // Abre o menu do usuário
  await page.getByRole("button", { name: "SA Super Admin" }).click();

  // Faz logout da conta
  await page.getByText("Log out").click();

  // Verifica se voltou para a tela de boas-vindas
  await page.getByRole("heading", { name: "Welcome to Strapi!" }).click(); // opcional como verificação
});
