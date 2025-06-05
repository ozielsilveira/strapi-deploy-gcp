## 1. Habilitar APIs necessárias na GCP

Antes de mais nada, no Console da GCP você precisa ativar as APIs que o Terraform e o GitHub Actions vão usar:

1. Acesse o Console GCP → **APIs & Services** → **Library**.
2. Habilite, pelo menos, estas APIs:

   * **Kubernetes Engine API**
   * **Compute Engine API**
   * **Cloud Resource Manager API**
   * **Cloud Storage (Google Cloud Storage) API**
   * **Identity and Access Management (IAM) API**

Isso garante que o Terraform consiga criar clusters GKE e buckets, e que o GitHub Actions consiga provisionar recursos.

---

## 2. Criar um Service Account (SA) e gerar a chave JSON

O GitHub Actions (via `google-github-actions/setup-gcloud`) usará um Service Account para autenticar e executar o Terraform e o kubectl. Faça assim:

1. Na GCP Console, navegue até **IAM & Admin → Service Accounts**.
2. Clique em **+ Create Service Account** e preencha:

   * **Service account name**: `github-actions-sa` (ou outro nome de sua escolha)
   * **Service account ID**: será gerado automaticamente com base no nome.
3. Após clicar em **Create and continue**, na etapa “Grant this service account access to project” atribua as seguintes roles mínimas:

   * **Kubernetes Engine Admin** (`roles/container.admin`)
   * **Service Account User** (`roles/iam.serviceAccountUser`)
   * **Storage Admin** (`roles/storage.admin`)

     > Esses papéis permitem criar/atualizar cluster GKE, criar buckets e acessar o bucket de estado do Terraform.
4. Clique em **Continue** e depois em **Done**.

Agora gere a chave JSON:

1. Na lista de Service Accounts, localize a conta `github-actions-sa` (ou o nome que você escolheu).
2. Clique no menu “⋮” (três pontinhos) à direita e selecione **Manage keys**.
3. Clique em **Add Key → Create new key**.
4. Escolha o formato **JSON** e clique em **Create**.

   * Isso fará o download de um arquivo `github-actions-sa-xxxxx.json` para sua máquina.
   * **Guarde-o temporariamente**: precisaremos do conteúdo para criar o Secret no GitHub.

---

## 3. Criar o bucket de estado remoto do Terraform (opcional, mas recomendado)

Para que o Terraform mantenha estado compartilhado (e o GitHub Actions possa rodar em runners diferentes), crie um bucket GCS:

1. No Console GCP, vá em **Cloud Storage → Buckets**.
2. Clique em **Create bucket**.
3. Defina:

   * **Name**: algo único, ex.: `meu-terraform-state-strapi-a3`
   * **Location type**: `Regional` ou `Multi-Regional` (escolha de acordo com sua política; `Regional` em `us-central1` é suficiente).
   * **Location**: `us-central1` (ou a região que você preferir)
   * Deixe as demais opções padrão (a menos que precise de versionamento ou restrições específicas).
4. Conclua a criação.

   * Anote o nome do bucket (ex.: `terraform-state-strapi-a3`).

---

## 4. Preparar o repositório GitHub e criar Secrets

Agora que temos:

* a conta de serviço JSON (arquivo baixado)
* um bucket de estado GCS (caso vá usar estado remoto)

Vamos ao GitHub:

1. No GitHub, entre no seu repositório fork do `devops-unisatc-a3`.

2. Vá em **Settings → Secrets and variables → Actions** → **New repository secret**.

3. Crie os seguintes secrets (cada campo deve receber exatamente o nome indicado):

   1. **`GCP_SA_KEY`**

      * Value: abra o arquivo JSON que você baixou (`github-actions-sa-xxxxx.json`) e copie TODO o conteúdo (o JSON inteiro).
      * No GitHub, no campo “Name” coloque `GCP_SA_KEY` e em “Value” cole o JSON completo.

   2. **`TF_BACKEND_BUCKET`**

      * Value: o nome exato do bucket GCS que você criou (ex.: `meu-terraform-state-strapi-a3`).
      * Em “Name” coloque `TF_BACKEND_BUCKET` e em “Value” cole `meu-terraform-state-strapi-a3`.

   3. **`TF_BACKEND_PREFIX`**

      * Value: um prefixo para organizar o estado dentro do bucket. Por exemplo: `a3/terraform-state`.
      * Em “Name” coloque `TF_BACKEND_PREFIX` e em “Value” cole `a3/terraform-state`.

   4. **`TF_VAR_project`**

      * Value: o ID do seu projeto GCP (que aparece no topo do Console, algo como `meu-projeto-123456`).
      * Em “Name” coloque `TF_VAR_project` e em “Value” cole esse ID.

   5. **`TF_VAR_region`** (ou, se preferir, `TF_VAR_location`)

      * Value: a região onde você quer rodar o cluster, por exemplo `us-central1`.
      * Em “Name” coloque `TF_VAR_region` e em “Value” cole `us-central1`.

   6. **`DOCKERHUB_USERNAME`**

      * Value: seu usuário no Docker Hub (ex.: `meuusuario`).
      * Em “Name” coloque `DOCKERHUB_USERNAME` e em “Value” cole `meuusuario`.

   7. **`DOCKERHUB_TOKEN`**

      * Value: um token pessoal do Docker Hub (ou a sua senha, se não usar token).
      * No Docker Hub, você pode gerar um “Access Token” em Account Settings → Security → New Access Token.
      * Copie o token gerado e cole no campo “Value”.
      * Nome do secret: `DOCKERHUB_TOKEN`.

4. Após criar todos esses sete secrets, seu repositório já estará apto a rodar GitHub Actions que usam GCP e Docker Hub.

---

## 5. Ajustar o Terraform para usar os novos secrets

Em `terraform/variables.tf`, você já definiu:

```hcl
variable "project" { type = string }
variable "region"  { type = string }
variable "cluster_name" { type = string, default = "strapi-a3-cluster" }
```

E, no backend, em `terraform/main.tf`, certifique-se de ter algo como:

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }

  backend "gcs" {
    bucket = var.TF_BACKEND_BUCKET      # herdará o value de TF_BACKEND_BUCKET
    prefix = var.TF_BACKEND_PREFIX      # herdará o value de TF_BACKEND_PREFIX
  }
}
```

> **Obs.:** se você usar `var.TF_BACKEND_BUCKET` e `var.TF_BACKEND_PREFIX` diretamente, lembre-se de declará-los também em `variables.tf`. Uma abordagem mais comum é referenciar diretamente as variáveis de ambiente (GitHub Secrets) na inicialização do Terraform. Exemplo:

```hcl
terraform {
  backend "gcs" {
    bucket = "${env.TF_BACKEND_BUCKET}"
    prefix = "${env.TF_BACKEND_PREFIX}"
  }
}
```

Assim, não é preciso declará-los como `variable` no Terraform — ele lerá direto das variáveis de ambiente `TF_BACKEND_BUCKET` e `TF_BACKEND_PREFIX` que o GitHub Actions exporta.

---

## 6. Configurar o GitHub Actions (Deploy Workflow)

Com os secrets criados, revise (ou crie) o arquivo `.github/workflows/deploy.yml` para usar esses valores. Um exemplo completo:

```yaml
name: CI/CD Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-push-image:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build Strapi (produção)
        run: npm run build    # caso exista script build no package.json

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        id: docker_build
        run: |
          IMAGE_NAME=${{ secrets.DOCKERHUB_USERNAME }}/strapi-a3:latest
          docker build -t $IMAGE_NAME .
          docker push $IMAGE_NAME
          echo "::set-output name=image::$IMAGE_NAME"

  deploy-terraform:
    name: Terraform Apply & Deploy to GKE
    needs: build-and-push-image
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.TF_VAR_project }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true

      - name: Configure kubectl automatic (após criar/atualizar cluster)
        # Este passo só funciona depois do terraform apply que gera o cluster
        # Então precisamos separar a inicialização do Terraform e a obtenção das credenciais
        # em duas etapas. Primeiro, rodamos o Terraform; depois, usamos get-gke-credentials.
        run: echo "Vai rodar o Terraform em seguida."

      - name: Initialize Terraform
        working-directory: ./terraform
        env:
          TF_VAR_project: ${{ secrets.TF_VAR_project }}
          TF_VAR_region:  ${{ secrets.TF_VAR_region }}
          TF_BACKEND_BUCKET: ${{ secrets.TF_BACKEND_BUCKET }}
          TF_BACKEND_PREFIX: ${{ secrets.TF_BACKEND_PREFIX }}
        run: |
          terraform init \
            -backend-config="bucket=${{ secrets.TF_BACKEND_BUCKET }}" \
            -backend-config="prefix=${{ secrets.TF_BACKEND_PREFIX }}"

      - name: Terraform Validate & Plan
        working-directory: ./terraform
        env:
          TF_VAR_project: ${{ secrets.TF_VAR_project }}
          TF_VAR_region:  ${{ secrets.TF_VAR_region }}
        run: |
          terraform validate
          terraform plan -out=tfplan

      - name: Terraform Apply
        working-directory: ./terraform
        env:
          TF_VAR_project: ${{ secrets.TF_VAR_project }}
          TF_VAR_region:  ${{ secrets.TF_VAR_region }}
        run: terraform apply -auto-approve tfplan

      - name: Get GKE Credentials
        uses: google-github-actions/get-gke-credentials@v1
        with:
          cluster_name: strapi-a3-cluster        # ou: ${{ var.cluster_name }} caso use var
          location: ${{ secrets.TF_VAR_region }} # mesma região definida em TF_VAR_region

      - name: Deploy to Kubernetes (aplica manifestos)
        run: |
          kubectl apply -f terraform/k8s/deployment.yaml
          kubectl apply -f terraform/k8s/service.yaml
```

**Detalhes importantes:**

* Na etapa **Initialize Terraform**, nós passamos as variáveis de ambiente para o próprio Terraform.
* O `terraform init` lê o backend-config diretamente do Secret `TF_BACKEND_BUCKET` e `TF_BACKEND_PREFIX`.
* É crucial que, depois do `terraform apply`, o recurso `google_container_cluster.primary` já exista, para que `google-github-actions/get-gke-credentials` consiga pegar as credenciais.
* Em `get-gke-credentials`, definimos `cluster_name` exatamente igual ao que informamos em `variables.tf` (ou o default).

---

## 7. Fluxo completo “do zero”

1. **Preparação no GCP**

   * Habilitou as APIs necessárias.
   * Criou Service Account (SA) e baixou JSON.
   * Criou bucket GCS para Terraform state.

2. **Configuração do GitHub**

   * Criou os Secrets: `GCP_SA_KEY`, `TF_BACKEND_BUCKET`, `TF_BACKEND_PREFIX`, `TF_VAR_project`, `TF_VAR_region`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

3. **Provisionamento com Terraform**

   * No seu repositório local (ou diretamente no GitHub Actions), o Terraform será executado:

     * `terraform init` (lendo backend config do bucket GCS)
     * `terraform plan` e `terraform apply` → Cria cluster GKE + node pool + namespace.

4. **Build e Push da Imagem Docker**

   * GitHub Actions → passo de login e `docker build/push` → envia `seuUsuario/strapi-a3:latest` ao Docker Hub.

5. **Implantação no Kubernetes**

   * GitHub Actions → após o Terraform, pega credenciais do GKE e faz `kubectl apply -f terraform/k8s/*.yaml`.

6. **Acesso ao Strapi em produção**

   * Dentro da GCP, o Service do tipo `LoadBalancer` criará um IP externo.
   * No console da GCP → Kubernetes Engine → Services & Ingress → procure por `strapi-service` → copie o “External IP” e acesse `http://EXTERNAL_IP` no navegador para ver o Strapi rodando.

---

## 8. Testando a primeira execução

1. **Commit inicial no `main`**

   * Garanta que seu repositório já contenha a pasta `terraform/`, os manifests em `terraform/k8s/` e o workflow `.github/workflows/deploy.yml`.
   * Faça um commit e dê push para `main`.

2. **Acompanhe o GitHub Actions**

   * Em **Actions**, você verá o job `CI/CD Deploy` iniciando.
   * Ele fará build da imagem Docker, enviará ao Docker Hub e, em seguida, rodará o Terraform.
   * Se tudo estiver correto (Service Account com permissões, bucket GCS existente e secrets preenchidos), o Terraform criará o cluster e os recursos.
   * Por fim, o passo de **Get GKE Credentials** deverá obter o contexto do kubectl, e o `kubectl apply` subirá o Deployment/Service no cluster.

3. **Verifique no GKE (Console)**

   * Após o job finalizar, vá no Console GKE e confirme que há um cluster chamado `strapi-a3-cluster` (ou o nome que você configurou).
   * Em seguida, clique em “Services & Ingress” → veja se existe o `strapi-service` e qual é o External IP.
   * Acesse esse IP no navegador para confirmar que o Strapi está rodando em produção.

---

## 9. Resumo das Secrets a criar

No GitHub, em **Settings → Secrets and variables → Actions**, crie estes 7 secrets:

| Secret Name          | Value                                                                          | O que faz                                |
| -------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `GCP_SA_KEY`         | JSON completo do Service Account criado (texto do arquivo `.json`)             | Autentica GitHub Actions na GCP          |
| `TF_BACKEND_BUCKET`  | Nome do bucket GCS para Terraform state (ex.: `meu-terraform-state-strapi-a3`) | Armazena estado remoto do Terraform      |
| `TF_BACKEND_PREFIX`  | Prefixo dentro do bucket (ex.: `a3/terraform-state`)                           | Organização do state no bucket           |
| `TF_VAR_project`     | ID do projeto GCP (ex.: `meu-projeto-123456`)                                  | Variável `project` que o Terraform usa   |
| `TF_VAR_region`      | Região GCP (ex.: `us-central1`)                                                | Variável `region` que o Terraform usa    |
| `DOCKERHUB_USERNAME` | Seu usuário Docker Hub (ex.: `meuusuario`)                                     | Autenticação para o Docker Hub           |
| `DOCKERHUB_TOKEN`    | Token de acesso ou senha do Docker Hub                                         | Autentica o push da imagem ao Docker Hub |

> **Dica:** após criar os secrets, faça um commit simples (como “atualiza workflows”) e dê push em `main` para disparar o primeiro build de pipeline e verificar logs de erro ou sucesso.

---

## 10. Observações finais

* Se surgir algum erro de permissão no Terraform ao criar o cluster, volte ao IAM da GCP e confira se o Service Account tem exatamente as roles necessárias (Container Admin, Service Account User, Storage Admin).
* Se o GKE demorar para provisionar, o passo “Get GKE Credentials” pode falhar por timeout; aguarde alguns minutos e rode o Workflow de novo, ou aumente o `timeout` na stage do Terraform.
* Depois que tudo rodar com sucesso, você terá um pipeline completo: **testes E2E em PRs** (com Playwright) e – no merge na `main` – **build/push de imagem Docker + deploy no GKE** usando Terraform.