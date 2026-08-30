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
   - **Node 24+** (npm CLI ≥ 11.5.1; Node 22 traz npm 10 e falha com `ENONPMTOKEN`)
   - **semantic-release ≥ 25** (`@semantic-release/npm@13` com OIDC; a v24 ainda exige `NPM_TOKEN`)
   - **Sem** `NPM_TOKEN` / `NODE_AUTH_TOKEN`
   - **Sem** `registry-url` no `actions/setup-node` (quebra OIDC)
3. Remover o secret `NPM_TOKEN` do GitHub **depois** do primeiro publish OIDC bem-sucedido.
4. Runner: **GitHub-hosted** (self-hosted não é suportado pelo npm OIDC).

## Se aparecer `ENONPMTOKEN`

O plugin antigo (`@semantic-release/npm@12`, bundled no semantic-release 24) ainda valida token no `verifyConditions`. Suba para semantic-release 25 e rode o release de novo no `master`. Não “consertar” recolocando `NPM_TOKEN` se o Trusted Publisher já está configurado.

## Fluxo

| Workflow | Ficheiro | Função |
| --- | --- | --- |
| CI | `ci.yml` | lint / build / test (PR + push) |
| Release | `release.yml` | test + `semantic-release` só em `push` → `master` |

Commits em `master` devem ser [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`) para o semantic-release gerar a versão.

## Fallback (só se OIDC falhar)

Token **granular** npm (não classic), expiração curta, Secret `NPM_TOKEN`. Rotação manual. Não é o caminho feliz.
