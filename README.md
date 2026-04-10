# inventory-control

Sistema web de estoque construído com Astro, Preact, TypeScript e PostgreSQL.

## Stack

- Astro com backend simples em rotas server-side
- Preact para formulários assíncronos e gráficos
- TypeScript em todo o projeto
- SCSS para a camada visual
- PostgreSQL como banco principal

## O que já está no projeto

- Dashboard com prioridade de compra baseada em estoque atual x estoque mínimo
- Busca de produto por código
- Cadastro de produtos
- Cadastro de fornecedores
- Registro de entradas e saídas
- Atualização automática do estoque ao movimentar entradas e saídas
- Página detalhada do produto com:
  - última entrada e última saída
  - histórico de entradas e saídas dos últimos 90 dias
  - ranking de maiores fornecedores no último ano
  - gráficos de movimentação
- SQL completo para criação da base
- Docker Compose para subir o PostgreSQL localmente com o schema automático

## Estrutura importante

```text
database/
  schema.sql
src/
  components/
  layouts/
  lib/
  pages/
docker-compose.yml
```

## Configuração local rápida

1. Instale as dependências:

```bash
npm install
```

2. Crie um arquivo `.env` baseado em `.env.example` e ajuste o branding do projeto nas variáveis `PUBLIC_APP_*`.

3. Suba o banco com Docker:

```bash
npm run db:up
```

O arquivo `database/schema.sql` é executado automaticamente na primeira inicialização do container.

4. Rode o projeto:

```bash
npm run dev
```

## Variáveis de ambiente

```env
PUBLIC_APP_NAME=inventory-control
PUBLIC_APP_SHORT_NAME=IC
PUBLIC_APP_TAGLINE=Gestão de estoque
COMPOSE_PROJECT_NAME=inventory-control
POSTGRES_DB=inventory_control
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_control
DATABASE_SSL=false
```

## Scripts úteis

- `npm run db:up` sobe o PostgreSQL em Docker
- `npm run db:down` para o container
- `npm run db:logs` acompanha os logs do banco
- `npm run db:reset` remove o volume do banco para recriar tudo do zero
- `npm run check` valida o projeto com `astro check`

## Rotas principais

- `/` dashboard
- `/produtos` cadastro e catálogo de produtos
- `/fornecedores` cadastro e catálogo de fornecedores
- `/produto/[codigo]` detalhe do produto e movimentações

## Instruções para o Codex

- Sempre utilizar mensagens de commit no padrão semântico, com prefixos como `feat:`, `fix:`, `chore:`, `refactor:`, `docs:` e similares.
- Nunca criar commit sem prefixo semântico.
- Sempre escrever textos visíveis ao usuário em pt-BR, com acentuação correta.
- Sempre revisar mensagens de erro, rótulos, placeholders, descrições, títulos e documentação para manter português natural e consistente.
- Preservar os padrões visuais, estruturais e de nomenclatura já adotados no projeto.
- Manter o nome do app configurável por variáveis de ambiente, sem hardcode de marca nos textos da interface.
- Antes de concluir mudanças relevantes, validar o projeto com `npm run check`.
- Não alterar rotas, contratos de API, nomes de tabelas ou identificadores internos sem necessidade clara.
- Ao editar documentação ou exemplos, manter alinhamento com os valores atuais de `.env.example`, `docker-compose.yml` e `package.json`.
