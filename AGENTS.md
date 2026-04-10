# AGENTS.md

Instruções operacionais para agentes trabalhando neste repositório.

## Contexto do projeto

- Nome do app: `inventory-control`
- Stack principal: Astro, Preact, TypeScript, SCSS e PostgreSQL
- O nome da aplicação deve vir de variáveis de ambiente, sem hardcode de marca na interface

## Commits

- Sempre usar mensagens de commit com padrão semântico
- Prefixos esperados: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- Nunca criar commit sem prefixo semântico

## Textos e idioma

- Todo texto visível ao usuário deve estar em pt-BR
- Sempre usar acentuação correta
- Revisar títulos, descrições, labels, placeholders, mensagens de erro e documentação
- Evitar texto com encoding quebrado

## Convenções do projeto

- Preservar padrões visuais, estruturais e de nomenclatura já existentes
- Não alterar rotas, contratos de API, nomes de tabelas ou identificadores internos sem necessidade clara
- Ao editar documentação e exemplos, manter alinhamento com `.env.example`, `docker-compose.yml` e `package.json`
- Manter o branding configurável por envs, especialmente `PUBLIC_APP_NAME`, `PUBLIC_APP_SHORT_NAME` e `PUBLIC_APP_TAGLINE`

## Validação

- Antes de concluir mudanças relevantes, executar `npm run check`
- Se houver mudança de configuração, validar também os arquivos afetados

## Preferências de trabalho

- Fazer mudanças objetivas e consistentes com o restante do código
- Não introduzir convenções novas sem necessidade
- Quando houver dúvida entre duas abordagens equivalentes, preferir a mais simples
