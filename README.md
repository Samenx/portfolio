# SAMEN-PC Portfolio

## Live content admin setup

The Content Admin saves the portfolio's live data to `artifacts/api-server/data/portfolio-content.json`; no database or hosting account is required. Configure the API using [`artifacts/api-server/.env.example`](artifacts/api-server/.env.example), then run it alongside the portfolio and route `/api/*` to it.

The portfolio reads `GET /api/portfolio` publicly; the default admin password is `2005` (override `ADMIN_PASSWORD` before public deployment). Uploaded images are stored in the JSON file as data URLs, so keep image uploads reasonably small.
