# SAMEN-PC Portfolio

## Live content admin setup

The Content Admin saves the portfolio's live data to `artifacts/api-server/data/portfolio-content.json`; no database or hosting account is required. Configure the API using [`artifacts/api-server/.env.example`](artifacts/api-server/.env.example), then run it alongside the portfolio and route `/api/*` to it.

The portfolio reads `GET /api/portfolio` publicly; the default admin password is `2005` (override `ADMIN_PASSWORD` before public deployment). Uploaded images are stored in the JSON file as data URLs, so keep image uploads reasonably small.

## Vercel deployment

Vercel builds the frontend using the settings in [`vercel.json`](vercel.json) and
serves the existing API through the functions in [`api`](api). Before deploying,
add these environment variables in **Vercel Project Settings →
Environment Variables** for the Production environment:

- `ADMIN_PASSWORD` — the administrator password.
- `ADMIN_SESSION_SECRET` — a random secret of at least 32 characters.
- `GITHUB_REPOSITORY` — the repository in `owner/repository` form.
- `GITHUB_TOKEN` — a GitHub fine-grained personal access token with **Contents:
  Read and write** permission for this repository.

The content API writes changes to `content/portfolio-content.json` in the GitHub
repository, so the GitHub token is required when saving content from the admin
panel. The `.github/workflows/deploy.yml` workflow is only for GitHub Pages and
is not used by Vercel.
