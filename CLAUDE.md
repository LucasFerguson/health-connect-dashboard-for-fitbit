# CLAUDE.md

Self-hosted health dashboard (Next.js) over the HCGateway backend in
`/root/HCGateway`. Read the code to find what to change; this file only lists
things that aren't obvious from it.

- **Show all the data.** Never hide a field because it looks odd; missing data
  is "—", never 0.
- **Data comes from HCGateway's GraphQL API** via Apollo (REST only for
  login/signup/account). Run Prettier before `npm run codegen`.
- **Checks:** `npm run check` and `npm test`. To see pages in a headless
  browser: `scripts/dev-session.sh create`, then `npm run browser-check --
  [paths]`, then `scripts/dev-session.sh delete` (ask the user first: it
  creates a credential for their account).
- **Deploy:** `scripts/deploy.sh up prod|dev|all`, `status`, `rollback`.
- **Manual tests** the user still has to run live in
  `docs/manual-test-checklist.md`; the story so far is in `JOURNAL.md`.
