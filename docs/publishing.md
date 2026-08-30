# Publishing (2026)

Este pacote publica no npm via **Trusted Publishing (OIDC)**. Não use `NPM_TOKEN` classic no GitHub Secrets.

## Checklist (uma vez)

1. Em [npmjs.com](https://www.npmjs.com/) → pacote `maestro-express-async-errors` → **Trusted Publisher** → GitHub Actions:
   - Organization / user: `jjgouveia`
   - Repository: `maestro-express-async-errors`
   - Workflow filename: **`release.yml`** (só o nome do ficheiro, com extensão)
   - Environment: vazio (a menos que uses GitHub Environment)
   - Allowed actions: **`npm publish`**
2. Confirmar que [`.github/workflows/release.yml`](../.github/workflows/release.yml) existe e tem:
   - `permissions.id-token: write`
   - `contents` / `issues` / `pull-requests` write
   - **Sem** `NPM_TOKEN` / `NODE_AUTH_TOKEN`
   - **Sem** `registry-url` no `actions/setup-node` (quebra OIDC)
3. Remover o secret `NPM_TOKEN` do GitHub **depois** do primeiro publish OIDC bem-sucedido.
4. Runner: **GitHub-hosted** (self-hosted não é suportado pelo npm OIDC).

## Fluxo

| Workflow | Ficheiro | Função |
| --- | --- | --- |
| CI | `ci.yml` | lint / build / test (PR + push) |
| Release | `release.yml` | test + `semantic-release` só em `push` → `master` |

Commits em `master` devem ser [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`) para o semantic-release gerar a versão.

## Fallback (só se OIDC falhar)

Token **granular** npm (não classic), expiração curta, Secret `NPM_TOKEN`. Rotação manual. Não é o caminho feliz.
